#!/usr/bin/env python3
"""
Build the reproducible release zip that HACS and the Marketplace install.

The zip holds the contents of ``custom_components/wattpilot/`` at its root
(``manifest.json`` at the top level), which HACS and the Marketplace extract into
``config/custom_components/wattpilot/``. ``SHA256SUMS`` is written next to it.

Only files Git tracks are packaged, so local leftovers never ship. The file list is
checked before anything is written: the files the integration needs to load are
present, the card bundles ``frontend.py`` serves are present, and every relative
import in the frontend bundles resolves inside the zip.

The same commit always builds a byte-identical zip: entries are sorted, every
timestamp comes from ``SOURCE_DATE_EPOCH`` (the release commit's time in CI), and
permissions and compression settings are fixed.

Usage:
    python3 scripts/build_release_zip.py [--output-dir dist] [--version v2026.10.2]
"""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
import os
import posixpath
import re
import subprocess
import sys
import time
import zipfile
from pathlib import Path, PurePosixPath
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Iterator, Sequence

REPO_ROOT = Path(__file__).resolve().parents[1]
PACKAGE_DIR = REPO_ROOT / "custom_components" / "wattpilot"
ZIP_NAME = "wattpilot.zip"
CHECKSUMS_NAME = "SHA256SUMS"

# 1980-01-01T00:00:00Z, the earliest timestamp a zip entry can store.
ZIP_EPOCH = 315532800
BYTECODE_SUFFIXES = (".pyc", ".pyo")
# The files Home Assistant needs to load the integration, its translations and
# brand icons, and the module that serves the dashboard card bundles.
REQUIRED_FILES = (
    "manifest.json",
    "__init__.py",
    "config_flow.py",
    "const.py",
    "frontend.py",
    "services.yaml",
    "strings.json",
    "icons.json",
    "translations/en.json",
    "translations/de.json",
    "brand/icon.png",
    "brand/icon@2x.png",
    "brand/logo.png",
    "brand/logo@2x.png",
)
# frontend.py serves FRONTEND_DIR/<name> for every name in its CARD_FILES tuple.
FRONTEND_MODULE = "frontend.py"
FRONTEND_DIR = "frontend"
CARD_FILES_NAME = "CARD_FILES"
# Relative specifiers in static imports, re-exports and dynamic imports.
JS_RELATIVE_IMPORT = re.compile(
    r"""(?:\bfrom|\bimport)\s*\(?\s*["'`](\.{1,2}/[^"'`]+)["'`]"""
)
FILE_MODE = 0o100644  # regular file, rw-r--r--
COMPRESS_LEVEL = 9


class ReleaseZipError(Exception):
    """Raised when the release zip cannot be built."""


def tracked_files(package_dir: Path) -> list[str]:
    """Return the files Git tracks under ``package_dir``, relative to it."""
    try:
        result = subprocess.run(  # noqa: S603 - fixed Git arguments
            ["git", "-C", str(package_dir), "ls-files", "-z", "--", "."],  # noqa: S607
            check=True,
            capture_output=True,
            text=True,
        )
    except (OSError, subprocess.CalledProcessError) as err:
        msg = f"{package_dir} is not inside a Git work tree"
        raise ReleaseZipError(msg) from err
    return [name for name in result.stdout.split("\0") if name]


def iter_package_files(package_dir: Path) -> Iterator[Path]:
    """Yield the tracked runtime files under ``package_dir``, sorted."""
    files: list[Path] = []
    for name in tracked_files(package_dir):
        relative = Path(name)
        if any(part.startswith(".") for part in relative.parts):
            continue
        if "__pycache__" in relative.parts or name.endswith(BYTECODE_SUFFIXES):
            msg = f"Bytecode is tracked in Git: {name}"
            raise ReleaseZipError(msg)
        path = package_dir / relative
        if path.is_symlink():
            msg = f"Symbolic links are not allowed: {name}"
            raise ReleaseZipError(msg)
        if not path.is_file():
            msg = f"Tracked file is missing from the checkout: {name}"
            raise ReleaseZipError(msg)
        files.append(relative)
    yield from sorted(files, key=lambda p: p.as_posix())


def card_files(package_dir: Path) -> tuple[str, ...]:
    """Return the card bundle names ``frontend.py`` serves (its ``CARD_FILES``)."""
    source = (package_dir / FRONTEND_MODULE).read_text(encoding="utf-8")
    for node in ast.walk(ast.parse(source, filename=FRONTEND_MODULE)):
        target: ast.expr
        value: ast.expr | None
        if isinstance(node, ast.AnnAssign):
            target, value = node.target, node.value
        elif isinstance(node, ast.Assign) and len(node.targets) == 1:
            target, value = node.targets[0], node.value
        else:
            continue
        if not isinstance(target, ast.Name) or target.id != CARD_FILES_NAME:
            continue
        try:
            names = ast.literal_eval(value) if value is not None else None
        except ValueError:
            names = None
        if (
            isinstance(names, tuple)
            and names
            and all(isinstance(name, str) and name for name in names)
        ):
            return names
        break
    msg = f"{FRONTEND_MODULE} has no literal tuple {CARD_FILES_NAME}"
    raise ReleaseZipError(msg)


def check_members(package_dir: Path, names: Sequence[str]) -> None:
    """Fail unless the file list can load as an integration with working cards."""
    members = set(names)
    for required in REQUIRED_FILES:
        if required not in members:
            msg = f"{required} is missing from the package"
            raise ReleaseZipError(msg)
    for card in card_files(package_dir):
        bundle = f"{FRONTEND_DIR}/{card}"
        if bundle not in members:
            msg = f"{bundle} is missing from the package ({FRONTEND_MODULE} serves it)"
            raise ReleaseZipError(msg)
    for name in names:
        if name.startswith("custom_components/"):
            msg = f"Entry is not at the zip root: {name}"
            raise ReleaseZipError(msg)
        if not name.endswith(".js"):
            continue
        source = (package_dir / name).read_text(encoding="utf-8")
        for specifier in JS_RELATIVE_IMPORT.findall(source):
            target = posixpath.normpath(
                (PurePosixPath(name).parent / specifier).as_posix()
            )
            if target not in members:
                msg = f"{name} imports {specifier}, which is not in the package"
                raise ReleaseZipError(msg)


def source_date_epoch(environ: dict[str, str] | None = None) -> int:
    """Return the entry timestamp from ``SOURCE_DATE_EPOCH`` (clamped to 1980)."""
    value = (os.environ if environ is None else environ).get("SOURCE_DATE_EPOCH")
    if not value:
        return ZIP_EPOCH
    try:
        epoch = int(value)
    except ValueError as err:
        msg = f"Invalid SOURCE_DATE_EPOCH: {value!r}"
        raise ReleaseZipError(msg) from err
    return max(epoch, ZIP_EPOCH)


def manifest_version(package_dir: Path) -> str:
    """Return the ``version`` from the package's ``manifest.json``."""
    manifest_path = package_dir / "manifest.json"
    if not manifest_path.is_file():
        msg = f"{manifest_path} not found"
        raise ReleaseZipError(msg)
    version = json.loads(manifest_path.read_text(encoding="utf-8")).get("version")
    if not isinstance(version, str) or not version:
        msg = "manifest.json has no version"
        raise ReleaseZipError(msg)
    return version


def check_version(package_dir: Path, expected: str) -> None:
    """Fail when ``manifest.json`` does not match the release tag ``expected``."""
    expected = expected.removeprefix("v")
    actual = manifest_version(package_dir)
    if actual != expected:
        msg = f"manifest.json version {actual} does not match release {expected}"
        raise ReleaseZipError(msg)


def build_zip(package_dir: Path, zip_path: Path, epoch: int) -> list[str]:
    """Write the reproducible zip and return its entry names in order."""
    date_time = time.gmtime(epoch)[:6]
    names = [relative.as_posix() for relative in iter_package_files(package_dir)]
    check_members(package_dir, names)
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "w") as archive:
        for name in names:
            info = zipfile.ZipInfo(name, date_time=date_time)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3  # Unix, so external_attr holds the file mode
            info.external_attr = FILE_MODE << 16
            data = (package_dir / name).read_bytes()
            archive.writestr(info, data, compresslevel=COMPRESS_LEVEL)
    return names


def write_checksums(output_dir: Path, file_names: Sequence[str]) -> Path:
    """Write ``SHA256SUMS`` in the format ``sha256sum -c`` reads."""
    lines = []
    for file_name in file_names:
        digest = hashlib.sha256((output_dir / file_name).read_bytes()).hexdigest()
        lines.append(f"{digest}  {file_name}\n")
    checksums_path = output_dir / CHECKSUMS_NAME
    checksums_path.write_text("".join(lines), encoding="utf-8")
    return checksums_path


def build_release(
    output_dir: Path,
    *,
    package_dir: Path = PACKAGE_DIR,
    version: str | None = None,
    environ: dict[str, str] | None = None,
) -> Path:
    """Build ``wattpilot.zip`` and ``SHA256SUMS`` in ``output_dir``."""
    if version is not None:
        check_version(package_dir, version)
    zip_path = output_dir / ZIP_NAME
    build_zip(package_dir, zip_path, source_date_epoch(environ))
    write_checksums(output_dir, [ZIP_NAME])
    return zip_path


def main(argv: Sequence[str] | None = None) -> int:
    """Run the command-line interface."""
    parser = argparse.ArgumentParser(description="Build the release zip.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=REPO_ROOT / "dist",
        help="Directory for wattpilot.zip and SHA256SUMS (default: dist)",
    )
    parser.add_argument(
        "--version",
        help="Release version or tag; fail if manifest.json differs",
    )
    args = parser.parse_args(argv)

    try:
        zip_path = build_release(args.output_dir, version=args.version)
    except ReleaseZipError as err:
        print(f"Error: {err}", file=sys.stderr)
        return 1

    digest = hashlib.sha256(zip_path.read_bytes()).hexdigest()
    with zipfile.ZipFile(zip_path) as archive:
        count = len(archive.namelist())
    print(f"Built {zip_path} ({count} files, sha256 {digest})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
