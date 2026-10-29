"""Tests for scripts/hassfest with a local Core origin and fake Python tooling."""

from __future__ import annotations

import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
TAG = "2026.10.2"

# Stands in for python3 and uv: records its arguments, one call per line, each
# argument followed by a unit separator because the paths contain spaces.
FAKE_TOOL = """#!/bin/bash
printf '%s\\037' "$(basename "$0")" "$@" >> "$TRACE"
printf '\\n' >> "$TRACE"
"""


def _git(cwd: Path, *args: str) -> str:
    return subprocess.run(  # noqa: S603 - fixed Git executable and fixture arguments
        ["git", "-c", "commit.gpgsign=false", *args],  # noqa: S607
        cwd=cwd,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()


@dataclass
class Project:
    """A copy of the scripts, a local Core origin and fake tools on PATH."""

    root: Path
    origin: Path
    env: dict[str, str]

    def run(self, *args: str) -> subprocess.CompletedProcess[str]:
        """Run scripts/hassfest in the project copy."""
        return subprocess.run(  # noqa: S603 - bash runs a fixed script copy
            ["bash", str(self.root / "scripts" / "hassfest"), *args],  # noqa: S607
            cwd=self.root,
            env=self.env,
            capture_output=True,
            text=True,
            check=False,
            timeout=120,
        )

    def calls(self) -> list[list[str]]:
        """Return the recorded python3 and uv calls."""
        trace = Path(self.env["TRACE"])
        if not trace.exists():
            return []
        return [
            line.rstrip("\x1f").split("\x1f") for line in trace.read_text().splitlines()
        ]

    def hassfest_call(self) -> list[str]:
        """Return the one call that runs the validator."""
        runs = [call for call in self.calls() if "script.hassfest" in call]
        assert len(runs) == 1, self.calls()
        return runs[0]


def _core_origin(path: Path, *, packaged: bool) -> Path:
    files = {
        "pyproject.toml": "[project]\nname = 'homeassistant'\n",
        "homeassistant/const.py": "__version__ = '2026.10.2'\n",
        "script/hassfest/__main__.py": "# Synthetic validator\n",
        "requirements.txt": "packaging>=23.1\n",
        "requirements_all.txt": "# All requirements\n",
        "tests/excluded.py": "# Outside the sparse checkout\n",
    }
    if packaged:
        files["packages/hassfest/pyproject.toml"] = "[project]\nname = 'hassfest'\n"
    for name, content in files.items():
        file_path = path / name
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(content)
    _git(path, "init", "-q", "--initial-branch=dev")
    _git(path, "config", "user.name", "Fixture")
    _git(path, "config", "user.email", "fixture@example.invalid")
    # Lets a shallow, blobless clone fetch by commit or tag from this origin.
    _git(path, "config", "uploadpack.allowFilter", "true")
    _git(path, "config", "uploadpack.allowAnySHA1InWant", "true")
    _git(path, "add", ".")
    _git(path, "commit", "-q", "-m", "Core")
    _git(path, "tag", TAG)
    return path


def _project(tmp_path: Path, *, packaged: bool, uv: bool = True) -> Project:
    root = tmp_path / "project with spaces"
    (root / "scripts").mkdir(parents=True)
    shutil.copy2(REPO_ROOT / "scripts" / "hassfest", root / "scripts" / "hassfest")
    (root / "custom_components" / "wattpilot").mkdir(parents=True)
    origin = _core_origin(tmp_path / "core origin", packaged=packaged)
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    tools = ["python3", "uv"] if uv else ["python3"]
    for tool in tools:
        (bin_dir / tool).write_text(FAKE_TOOL)
        (bin_dir / tool).chmod(0o755)
    git_dir = Path(shutil.which("git") or "/usr/bin/git").parent
    env = {
        "HOME": str(tmp_path),
        "PATH": os.pathsep.join([str(bin_dir), str(git_dir), "/usr/bin", "/bin"]),
        "VIRTUAL_ENV": str(tmp_path / "venv"),
        "HA_VERSION": TAG,
        "HA_CORE_REPO": origin.as_uri(),
        "TRACE": str(tmp_path / "trace.txt"),
        "GIT_CONFIG_NOSYSTEM": "1",
        "GIT_CONFIG_GLOBAL": os.devnull,
    }
    return Project(root=root, origin=origin, env=env)


@pytest.mark.parametrize("packaged", [True, False], ids=["2026.11+", "before-2026.11"])
def test_validator_package_is_used_only_when_core_ships_it(
    tmp_path: Path, packaged: bool
) -> None:
    """Core 2026.11 moved the validator into packages/hassfest; older Cores lack it."""
    project = _project(tmp_path, packaged=packaged)

    result = project.run()

    assert result.returncode == 0, result.stdout + result.stderr
    core = project.root / ".local" / "ha-core"
    assert (core / "script" / "hassfest" / "__main__.py").is_file()
    assert (core / "pyproject.toml").is_file()
    assert not (core / "tests").exists()
    call = project.hassfest_call()
    editable = str(core / "packages" / "hassfest")
    if packaged:
        assert call[:6] == [
            "uv",
            "run",
            "--no-project",
            "--with-editable",
            editable,
            "python3",
        ]
    else:
        assert call[0] == "python3"
        assert "--with-editable" not in call
    assert call[-2:] == ["--skip-plugins", "quality_scale,requirements"]


def test_without_uv_the_validator_package_is_installed_with_pip(
    tmp_path: Path,
) -> None:
    """Without uv, the package is installed editable into the active environment."""
    project = _project(tmp_path, packaged=True, uv=False)

    result = project.run("--skip-plugins", "")

    assert result.returncode == 0, result.stdout + result.stderr
    editable = str(project.root / ".local" / "ha-core" / "packages" / "hassfest")
    installs = [call for call in project.calls() if "--editable" in call]
    assert len(installs) == 1
    assert installs[0][-2:] == ["--editable", editable]
    call = project.hassfest_call()
    assert call[0] == "python3"
    assert "--skip-plugins" not in call


def test_old_cache_gains_the_validator_package(tmp_path: Path) -> None:
    """A cache made before packages/hassfest was in the sparse set is repaired."""
    project = _project(tmp_path, packaged=True)
    core = project.root / ".local" / "ha-core"
    core.mkdir(parents=True)
    _git(core, "init", "-q")
    _git(core, "remote", "add", "origin", project.origin.as_uri())
    _git(core, "config", "core.sparseCheckout", "true")
    (core / ".git" / "info" / "sparse-checkout").write_text("script/\nhomeassistant/\n")
    _git(core, "fetch", "-q", "--depth", "1", "origin", "tag", TAG)
    _git(core, "checkout", "-q", TAG)
    assert not (core / "packages").exists()

    result = project.run()

    assert result.returncode == 0, result.stdout + result.stderr
    assert "Using cached version" in result.stdout
    assert (core / "packages" / "hassfest" / "pyproject.toml").is_file()
    assert "--with-editable" in project.hassfest_call()


def test_commit_sha_selects_that_core_revision(tmp_path: Path) -> None:
    """HA Next passes Core dev as a commit SHA, so install and Hassfest match."""
    project = _project(tmp_path, packaged=True)
    revision = _git(project.origin, "rev-parse", "HEAD")
    project.env["HA_VERSION"] = revision

    first = project.run()
    second = project.run()

    assert first.returncode == 0, first.stdout + first.stderr
    assert second.returncode == 0, second.stdout + second.stderr
    core = project.root / ".local" / "ha-core"
    assert _git(core, "rev-parse", "HEAD") == revision
    assert f"Using cached version {revision}" in second.stdout


def test_missing_revision_fails(tmp_path: Path) -> None:
    """A Core revision that cannot be checked out stops before validating."""
    project = _project(tmp_path, packaged=True)
    project.env["HA_VERSION"] = "1999.1.0"

    result = project.run()

    assert result.returncode == 1
    assert "could not be checked out" in result.stdout + result.stderr
    assert not [call for call in project.calls() if "script.hassfest" in call]


def test_failed_first_clone_is_retried(tmp_path: Path) -> None:
    """A cache left empty by a failed first clone does not block the next run."""
    project = _project(tmp_path, packaged=True)
    project.env["HA_VERSION"] = "1999.1.0"
    assert project.run().returncode == 1

    project.env["HA_VERSION"] = TAG
    result = project.run()

    assert result.returncode == 0, result.stdout + result.stderr
    assert f"Updating to version {TAG}" in result.stdout
    assert "--with-editable" in project.hassfest_call()


def test_validator_reads_core_requirement_files(tmp_path: Path) -> None:
    """Hassfest gets Core's path, so its requirements plugin checks something."""
    project = _project(tmp_path, packaged=True)

    result = project.run()

    assert result.returncode == 0, result.stdout + result.stderr
    core = project.root / ".local" / "ha-core"
    call = project.hassfest_call()
    assert call[call.index("--core-path") + 1] == str(core)
    assert (core / "requirements.txt").is_file()
    assert (core / "requirements_all.txt").is_file()


def test_update_advances_a_cached_dev_checkout(tmp_path: Path) -> None:
    """--update on Core dev validates the newest dev commit, not the cached one."""
    project = _project(tmp_path, packaged=True)
    project.env["HA_VERSION"] = "dev"
    assert project.run().returncode == 0
    (project.origin / "homeassistant" / "const.py").write_text("__version__ = 'next'\n")
    _git(project.origin, "commit", "-q", "-am", "Next")
    newest = _git(project.origin, "rev-parse", "HEAD")

    result = project.run("--update")

    assert result.returncode == 0, result.stdout + result.stderr
    assert _git(project.root / ".local" / "ha-core", "rev-parse", "HEAD") == newest
