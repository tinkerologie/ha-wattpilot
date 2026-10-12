# AI Agent Instructions for Home Assistant Fronius Wattpilot Integration

> Single source of truth for all AI coding assistants working on this repository.

## Project Identity

| Key | Value |
| --- | --- |
| **Name** | Home Assistant Fronius Wattpilot Integration |
| **Repository** | `github.com/ruaan-deysel/ha-wattpilot` |
| **Default Branch** | `master` |
| **Description** | Home Assistant integration for Fronius Wattpilot electric vehicle chargers. |

## Mandatory Development Workflow for AI Agents

All AI coding assistants (Claude Code, Gemini, GitHub Copilot, Cursor, Roo, Devin, etc.) MUST strictly adhere to the following workflow when working on this repository:

1. Issue-First Requirement: Never start writing code or creating pull requests without an existing GitHub Issue.
2. Issue Template: Issues must be created using the official Issue Forms (`01-bug-report.yml` for bugs or `02-enhancement-request.yml` for enhancements).
3. CodeRabbit AI Plan: Every issue must have a generated Coding Plan from CodeRabbit AI (`@coderabbitai plan`). AI agents must read and implement strictly according to the approved plan.
4. Branch Discipline: Always create and work on a dedicated branch (`feat/<issue-id>-<description>` or `fix/<issue-id>-<description>`). NEVER commit directly to `master`.
5. Documentation & Changelog: Update `CHANGELOG.md` under `## [Unreleased]` for any user-facing or architectural changes.
6. Local Verification: Run all test, lint, format, and typecheck commands locally before committing. All tests must pass with zero errors and zero warnings.
7. PR Template Completion: Always use `.github/PULL_REQUEST_TEMPLATE.md`. Complete all fields, link the issue using `Fixes #<id>` or `Closes #<id>`, and check all Pre-Submission Governance boxes with real terminal output.
8. Draft PR First: ALWAYS open pull requests as DRAFT (`gh pr create --draft`).
9. CI Verification: Wait for CI workflows to run on the draft PR and verify that all status checks pass.
10. Ready for Review: Only mark the PR as ready for review (`gh pr ready`) once all checks pass and all due diligence is verified.
11. Review Clearance: Review and resolve all CodeRabbit AI and GitHub Copilot comments. Ensure Codecov reports show zero errors, zero warnings, and no coverage drop.


## Executable Verification Commands

- `pytest` — Run unit and integration tests
- `ruff check .` — Run ruff linter
- `ruff format --check .` — Check code formatting
- `mypy custom_components` — Static type checking
- `pre-commit run --all-files` — Run all configured pre-commit hooks

## Boundaries and Safety Constraints

- Always: Write tests for any new or modified functionality, verify changes locally, and update CHANGELOG.md under `[Unreleased]`.
- Ask first: Major architectural changes, removing public APIs, or adding heavy external dependencies.
- Never: Commit secrets, credentials, API keys, or private certificates. Never commit directly to `master`.

## Issue and Pull Request Governance

These rules apply to every contributor, including AI coding agents. The full org-wide rules are in
[GOVERNANCE.md](https://github.com/tinkerologie/.github/blob/main/GOVERNANCE.md).

1. **Issue first.** Open an issue with the bug or enhancement template before opening a pull
   request. Keep the title prefix `[Bug]:` or `[Enhancement]:`, followed by a space and the title.
   Automation applies the `bug` or `enhancement` label when it can tell the type, and CodeRabbit
   then posts a Coding Plan on the issue. Implement from that plan.
2. **Link the issue.** In the PR's **Related Issues** section write `Closes #<number>` (`Fixes`,
   `Resolves`, `Part of`, and `Related to` also work). `None` is only for maintainer housekeeping
   such as CI, documentation, or dependency updates; contributor changes need an issue.
3. **One change at a time.** Contributors without write access can have at most 2 open, non-draft
   pull requests here. GitHub enforces this limit, and draft pull requests do not count toward it.
   Do not open PRs that edit the same files as another open PR, such as `CHANGELOG.md`,
   translations, `README.md`, or generated bundles. Wait for the first to merge, rebase, then
   continue.
4. **Rebase before review.** Rebase on `master` before marking a PR ready for review.
5. **Resolve conflicts first.** When a PR gets the `conflicts` label, rebase on `master`,
   resolve the conflicts (keep every `CHANGELOG.md` entry under `[Unreleased]`), re-run the tests,
   and force-push before doing any other work.
6. **Stale items.** Issues and PRs with no activity for 14 days are labeled `stale` and closed 30
   days later unless there is new activity. These labels are exempt:
   - Issues: `pinned`, `security`, `confirmed`, `work-in-progress`, `priority: critical`, `priority: high`.
   - Pull requests: `pinned`, `security`, `work-in-progress`.
