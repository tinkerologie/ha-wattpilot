# Contributing to Home Assistant Fronius Wattpilot Integration

Thank you for your interest in contributing to Home Assistant Fronius Wattpilot Integration. This project welcomes contributions from human developers and autonomous AI coding agents alike.

Home Assistant integration for Fronius Wattpilot electric vehicle chargers.

To maintain code quality, protect maintainer capacity, and prevent maintainer burnout, all contributors must follow the standardized development and governance workflow outlined below.

---

## Code of Conduct and Standards

- Be respectful, constructive, and collaborative.
- Zero secrets policy: Never commit passwords, tokens, API keys, private certificates, or personal data.
- Anti-burnout principle: Perform full due diligence locally before opening pull requests or requesting review.

---

## Development Workflow

All contributions—whether submitted by humans or AI agents—must adhere to this step-by-step workflow:

### 1. Open a GitHub Issue First

- Every bug fix, feature, or enhancement must start with an issue.
- Use the appropriate GitHub Issue Form:
  - Bug Report (`01-bug-report.yml`)
  - Enhancement Request (`02-enhancement-request.yml`)
- Blank or unstructured issues are disabled. Pull requests without a corresponding issue will be closed.

### 2. CodeRabbit AI Plan Generation

- Once the issue is created, CodeRabbit AI is triggered to generate an implementation plan (either automatically via the `bug` or `enhancement` label, or by commenting `@coderabbitai plan` on the issue).
- CodeRabbit analyzes the codebase and posts a comprehensive Coding Plan containing:
  - Codebase research and affected components
  - Architectural design choices
  - Phased task breakdowns
  - Machine-readable agent prompts and verifiable acceptance criteria
- Contributors must review, refine, and confirm the plan before writing code. Do not start implementation without an approved plan.

### 3. Create a Dedicated Branch

- Create a feature or bugfix branch off `main`:
  - Features: `git checkout -b feat/<issue-number>-<short-description>`
  - Fixes: `git checkout -b fix/<issue-number>-<short-description>`
  - Documentation: `git checkout -b docs/<issue-number>-<short-description>`
- Never commit directly to the default branch (`main`).

### 4. Implementation and Local Validation

- Implement changes following project conventions and the approved plan.
- Update `CHANGELOG.md` under `## [Unreleased]` describing what changed and why.
- Run all required local validation checks (tests with coverage, linters, type checkers, and formatters). Ensure all checks pass with zero errors and zero warnings.

### 5. Follow the Pull Request Template

- Open a Pull Request using `.github/PULL_REQUEST_TEMPLATE.md`.
- Complete all sections in the template:
  - Summary of changes
  - Linked issue keywords (`Fixes #<issue>`, `Closes #<issue>`, `Addresses #<issue>`)
  - Verification steps and pasted terminal output
  - Mandatory Pre-Submission Governance checklist (every box must be checked)

### 6. Open PR as DRAFT First

- Pull requests MUST be opened in Draft mode (`gh pr create --draft` or choose "Create draft pull request" in GitHub).
- Draft PRs allow CI workflows to run in isolation without triggering premature reviewer notifications or consuming unnecessary review capacity.
- Verify that all CI checks pass in draft mode and confirm that everything is working as expected from your end.

### 7. Mark Ready for Review

- Only after all local and draft CI checks have succeeded, convert the pull request to "Ready for Review".
- Pull requests marked ready for review with failing checks, incomplete templates, or unverified changes will be converted back to draft or closed.

### 8. Automated Quality Gates and Merge Criteria

Before a pull request can be merged, it must satisfy all automated quality gates:

- CodeRabbit AI Review: All review comments and suggestions must be resolved or addressed.
- GitHub Copilot Code Review: Must pass with no blocking feedback.
- Codecov Coverage Reports: Must pass with zero errors, zero warnings, and no coverage regressions below the repository target.
- Branch Ruleset Checks: All required status checks defined in the default branch ruleset must pass.

---

## Local Development and Verification

### Prerequisites and Setup

- Python 3.14.2 or later
- Dependencies installed via `uv sync --group dev`
- Node.js 22 or later for the dashboard cards
- Pre-commit (`pre-commit install`)

### Validation Commands

```bash
# Run tests with pytest and coverage
pytest --cov=custom_components --cov-report=term-missing

# Linting and formatting with ruff
ruff check .
ruff format --check .

# Static type checking
mypy custom_components

# Run all pre-commit checks
pre-commit run --all-files
```

### Dashboard cards (frontend)

The cards live in `frontend/` (TypeScript 7 and Lit, bundled with Vite). The built
bundle `custom_components/wattpilot/frontend/wattpilot-cards.js` is committed so HACS
installs work without a build step; CI fails if it does not match the source.

```bash
cd frontend
npm ci
npm run typecheck   # tsc --noEmit (TypeScript 7)
npm test            # Vitest with coverage
npm run build       # rebuild the bundle, then commit it
```

Cards resolve entities by device and `translation_key`, so a new card role only needs
an entry in `frontend/src/entities.ts` that matches the key in `descriptions.py`.

### Deprecations and upcoming Home Assistant releases

Helper scripts live in `scripts/` (not `./script/`).

- **Current release (blocking):** `pytest` fails on deprecated use by the integration.
  - `pyproject.toml` `filterwarnings` turns `DeprecationWarning` and `PendingDeprecationWarning` raised from `custom_components.wattpilot` modules into errors. Third-party deprecations keep the default action.
  - Home Assistant logs, rather than warns, when an integration uses a deprecated API. `tests/fixtures/deprecations.py` collects the three formats when they name `wattpilot`: `Detected that custom integration 'wattpilot' …`, `The deprecated … was used from wattpilot.` and `custom_components.wattpilot.<module>::<Class> provides the deprecated …`. The autouse `fail_on_ha_deprecation_reports` fixture in `tests/conftest.py` fails the test that logged one. Fix the call in the integration (or the test double that triggers it); do not silence the check.
  - `tests/test_import_smoke.py` runs `scripts/import_smoke.py` in a clean interpreter, which imports every module against the locked Home Assistant.
  - `tests/test_entity_id_changed.py` applies Home Assistant's own re-add rule to every entity class: a class that overrides `async_added_to_hass` (or another add/remove hook) must also define `async_entity_id_changed` and pass `super()` to `async_delegate_entity_id_changed`.
- **Next release (early warning, non-blocking):** `.github/workflows/ha-next.yml` runs weekly, on demand, and on PRs that touch `pyproject.toml`, `manifest.json`, `scripts/import_smoke.py` or `scripts/hassfest`, on two channels:
  - `release`: the newest `homeassistant` on PyPI, beta included. It runs `python scripts/import_smoke.py`, the tests (only when a matching `pytest-homeassistant-custom-component` installs; the job summary says when it does not) and `HA_VERSION=<version> ./scripts/hassfest --skip-plugins ""`.
  - `dev`: the head of Core's `dev` branch, pinned to one commit. It runs the import smoke test and Hassfest at that commit; no harness matches `dev`, so pytest does not run.
  - Scheduled and manual runs on `main` keep one issue per channel, labelled `ha-next` and `bug`, and close it when the channel passes again.
- **Developer blog (early warning, non-blocking):** `.github/workflows/ha-dev-blog.yml` runs weekly and on demand (input `days`, default 22). `scripts/ha_dev_blog.py` reads the developer blog feed and searches `custom_components/wattpilot/` for the inline code named next to an announced deprecation, removal or breaking change. It opens one `HA dev blog: <post title>` issue per post that names something the integration uses, labelled `ha-dev-blog` and `enhancement`, and finds duplicates by the post link in open and closed issue bodies. Run it locally with `python3 scripts/ha_dev_blog.py --days 30`.
- **Labels:** the workflows set `bug` or `enhancement` when they create an issue, so CodeRabbit writes a coding plan; an issue opened with `GITHUB_TOKEN` never starts the issue labeler workflow. Missing labels are created first.
- **When HA Next fails:** open the run linked from the `ha-next` issue and read the job summary.
  - Import smoke or test failure: reproduce it in a scratch venv with `uv pip install . "homeassistant==<version>"` (for the dev channel, `"homeassistant @ https://github.com/home-assistant/core/archive/<commit>.tar.gz"`) and `python scripts/import_smoke.py`, then fix it with an API that also works on the minimum supported Home Assistant.
  - Hassfest failure: run the same command locally; a new validator rule or a changed Core layout may need a `scripts/hassfest` change.

### Release zip

Releases ship `wattpilot.zip`, which HACS and the Marketplace install (`hacs.json`
names it). `.github/workflows/release.yml` builds it with `scripts/build_release_zip.py`
when the `manifest.json` version changes on `main`. The script packages only the files
Git tracks under `custom_components/wattpilot/`, at the zip root, and fails when a
required file, the card bundle `frontend.py` serves, or a frontend import is missing.
Commit new files (for example a new frontend chunk) before building. To build and check
reproducibility locally:

```bash
export SOURCE_DATE_EPOCH=$(git log -1 --format=%ct)
python3 scripts/build_release_zip.py --output-dir dist/a --version "v$(jq -r .version custom_components/wattpilot/manifest.json)"
TZ=Pacific/Kiritimati python3 scripts/build_release_zip.py --output-dir dist/b
cmp dist/a/wattpilot.zip dist/b/wattpilot.zip && (cd dist/a && sha256sum -c SHA256SUMS)
```

The `Release zip` job in `validate.yml` runs the same check on every pull request.

---

## Commit Message Guidelines

We follow Conventional Commits:

- `feat(<scope>): <description>` — New feature
- `fix(<scope>): <description>` — Bug fix
- `docs(<scope>): <description>` — Documentation changes
- `test(<scope>): <description>` — Adding or updating tests
- `refactor(<scope>): <description>` — Code restructuring without functional change
- `chore(<scope>): <description>` — Tooling, dependencies, or repository maintenance

---

## Pull Request Governance Summary

- No spam or back-to-back PRs: Batch related changes into a single PR.
- AI-assisted PRs require human verification and local testing before submission.
- All template checkboxes must be confirmed.
- PRs must remain in Draft until verified.

## Issue and Pull Request Governance

These rules apply to every contributor, including AI coding agents. The full org-wide rules are in
[GOVERNANCE.md](https://github.com/tinkerologie/.github/blob/main/GOVERNANCE.md).

1. **Issue first.** Open an issue with the bug or enhancement template before opening a pull
   request. Keep the title prefix `[Bug]:` or `[Enhancement]:`, followed by a space and the title.
   Automation applies the `bug` or `enhancement` label when it can tell the type, and CodeRabbit
   then posts a Coding Plan on the issue. Implement from that plan. The labeler skips issues labeled
   `question`, `duplicate`, `invalid`, `wontfix`, or `no-type`, and never re-adds a type label that
   a maintainer removed.
2. **Link the issue.** In the PR's **Related Issues** section, write `Closes #<number>` (or `Fixes`
   or `Resolves`) when the PR completely resolves the issue; these keywords close it on merge. Use
   `Part of #<number>` or `Related to #<number>` for partial work. The linked issue must exist; an
   issue in another public repository (`owner/repo#123`) is fine. Only authors with write access or
   higher (maintainers) may write `None`, for housekeeping such as CI,
   documentation, or dependency updates; PR governance rejects `None` from everyone else.
3. **One change at a time.** Contributors without write access can have at most 2 open, non-draft
   pull requests here. GitHub enforces this limit, and draft pull requests do not count toward it.
   Do not open PRs that edit the same files as another open PR, such as `CHANGELOG.md`,
   translations, `README.md`, or generated bundles. Wait for the first to merge, rebase, then
   continue.
4. **Act on the Tinkerologie-Bot report.** When PR governance fails, Tinkerologie-Bot posts one comment
   listing every problem as a numbered item. Fix each item by editing the PR description or pushing
   the missing change; the check re-runs and the comment updates to passed.
5. **Rebase before review.** Rebase on `main` before marking a PR ready for review.
6. **Resolve conflicts first.** When a PR gets the `conflicts` label, rebase on `main`,
   resolve the conflicts (keep every `CHANGELOG.md` entry under `[Unreleased]`), re-run the tests,
   and force-push before doing any other work.
7. **Stale items.** Issues and PRs with no activity for 14 days are labeled `stale` and closed 30
   days later unless there is new activity. These labels are exempt:
   - Issues: `pinned`, `security`, `confirmed`, `work-in-progress`, `priority: critical`, `priority: high`.
   - Pull requests: `pinned`, `security`, `work-in-progress`.
