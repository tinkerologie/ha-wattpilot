# AI Agent Instructions for Home Assistant Fronius Wattpilot Integration

> Single source of truth for all AI coding assistants working on this repository.

## Project Identity

| Key                | Value                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| **Name**           | Home Assistant Fronius Wattpilot Integration                                |
| **Repository**     | `github.com/tinkerologie/ha-wattpilot`                                      |
| **Default Branch** | `main`                                                                      |
| **Description**    | Home Assistant integration for Fronius Wattpilot electric vehicle chargers. |

## Project Overview

This is a Home Assistant custom integration for Fronius Wattpilot EV chargers. It uses a reverse-engineered WebSocket API to communicate with the charger via local LAN or Fronius Cloud. The integration follows Home Assistant's Silver quality scale standards with DataUpdateCoordinator, comprehensive tests, and CI/CD.

## Mandatory Development Workflow for AI Agents

All AI coding assistants (Claude Code, Gemini, GitHub Copilot, Cursor, Roo, Devin, etc.) MUST strictly adhere to the following workflow when working on this repository:

1. Issue-First Requirement: Never start writing code or creating pull requests without an existing GitHub Issue.
2. Issue Template: Issues must be created using the official Issue Forms (`01-bug-report.yml` for bugs or `02-enhancement-request.yml` for enhancements).
3. CodeRabbit AI Plan: Every issue must have a generated Coding Plan from CodeRabbit AI (`@coderabbitai plan`). AI agents must read and implement strictly according to the approved plan.
4. Branch Discipline: Always create and work on a dedicated branch (`feat/<issue-id>-<description>` or `fix/<issue-id>-<description>`). NEVER commit directly to `main`.
5. Documentation & Changelog: Update `CHANGELOG.md` under `## [Unreleased]` for any user-facing or architectural changes.
6. Local Verification: Run all test, lint, format, and typecheck commands locally before committing. All tests must pass with zero errors and zero warnings.
7. PR Template Completion: Always use `.github/PULL_REQUEST_TEMPLATE.md`. Complete all fields, link the issue using `Closes #<id>` or `Fixes #<id>` when the PR fully resolves it, or `Part of #<id>` for partial work (only maintainers with write access may write `None`, for housekeeping), and check all Pre-Submission Governance boxes with real terminal output.
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

### Testing

```bash
./scripts/test                  # Run all tests
./scripts/test tests/test_sensor.py  # Run specific test file
python -m pytest tests/ -v --tb=short  # Direct pytest invocation
python -m pytest tests/ -k test_name   # Run specific test by name
python -m pytest tests/ --cov --cov-report=term-missing  # With coverage
```

### Linting

```bash
./scripts/lint                  # Format and lint with ruff
ruff format .                   # Format only
ruff check . --fix              # Lint only with auto-fix
```

### Development Environment

```bash
./scripts/setup                 # Install uv and sync dependencies
uv sync --group dev             # Install with dev dependencies
./scripts/develop               # Start Home Assistant dev instance with this integration
```

The project uses `uv` for dependency management with `pyproject.toml` as the source of truth. The dev instance uses `config/` directory for Home Assistant configuration and sets `PYTHONPATH` to include `custom_components/` to load the integration.

## Architecture

### Core Components

**Entry Point (`__init__.py`)**

- `async_setup`: Registers the actions (`services.async_setup_services`) and the dashboard card bundle (`frontend.async_register_frontend`) once per Home Assistant instance
- `async_setup_entry`: Connects the charger (`utils.async_connect_new_charger`), raises `ConfigEntryAuthFailed` on a rejected password and `ConfigEntryNotReady` on connection errors, creates the coordinator and forwards to platforms
- `async_unload_entry`: Unloads platforms and disconnects the charger; the websocket callback is removed through `entry.async_on_unload`
- Property update handler bridges WebSocket events to entity updates via `async_property_update_handler` (async function)
- `utils.async_PrepareChargerApiDefinition` loads wattpilot-api's YAML definition in the executor before connecting, so property writes never block the event loop (#173)

**Config Flow (`config_flow.py`)**

- Menu (`local` / `cloud`), connection test before creating the entry, unique ID = charger serial
- `async_step_reconfigure` replaces the old options flow; `async_step_reauth` handles password changes
- Schemas use `probatio` (Home Assistant 2026.9+), not voluptuous

**Data Flow**

```
Wattpilot WebSocket (push) → async_property_update_handler → Coordinator → CoordinatorEntity (sensors/switches/etc)
```

**DataUpdateCoordinator (`coordinator.py`)**

- `WattpilotCoordinator`: Wraps WebSocket push-based updates (no polling by default)
- `available` property: Checks `charger.connected` and `charger.properties_initialized`
- `async_handle_property_update`: Called when WebSocket receives property updates
- `_async_update_data`: Validates connection state and returns `charger.all_properties`

**Runtime Data (`types.py`)**

- `WattpilotRuntimeData`: Stored in `entry.runtime_data` (modern Home Assistant pattern)
  - `charger`: Wattpilot client instance (from wattpilot-api)
  - `coordinator`: WattpilotCoordinator instance
  - `push_entities`: Dict of entities receiving property updates
  - `params`: Connection configuration

**Base Entity (`entities.py`)**

- `ChargerPlatformEntity`: Base class for all platform entities (sensors, switches, etc.)
- Inherits from `CoordinatorEntity` for coordinated updates
- Supports filtering by firmware version, device variant, and connection type
- Properties can be sourced from `property` (charger properties), `attribute` (charger attributes), or `namespacelist`
- Uses `GetChargerProp` and `async_GetChargerProp` utilities to access charger data

**Platform Implementation Pattern**
Each platform (sensor, switch, button, number, select, update) follows this pattern:

1. Entity descriptions are defined in `descriptions.py` as dataclass instances (e.g., `WattpilotSensorEntityDescription`)
2. Python file (e.g., `sensor.py`) implements the platform:
   - `async_setup_entry`: Loads descriptions via `filter_descriptions()`, creates entities from descriptions
   - Platform-specific entity class inherits from `ChargerPlatformEntity`
   - Implements required properties/methods for the platform type

### Entity Description System

Entities are defined as Python dataclasses in `descriptions.py` with this structure:

```python
WattpilotSensorEntityDescription(
    key="session_energy",
    charger_key="wh",  # go-eCharger API key
    name="Session Energy",
    source=SOURCE_PROPERTY,  # "property" | "attribute" | "namespacelist"
    device_class=SensorDeviceClass.ENERGY,
    firmware=">=38.5",  # Optional: minimum firmware version
    variant="11",  # Optional: supported device variants
    connection="local",  # Optional: supported connection types
)
```

The `filter_descriptions()` helper filters entities by firmware version, device variant, and connection type at setup time.

### External Wattpilot API Package

The integration uses the external `wattpilot-api>=1.5.1` package (installed via `uv sync`). This package handles:

- WebSocket connection management (local and cloud)
- Property parsing and updates via `charger.all_properties` dict
- Charger model and variant detection
- Async-friendly event callback system via `charger.on_property_change()`

Key types:

```python
from wattpilot_api import Wattpilot, LoadMode, CarStatus

charger = Wattpilot(host, password)
await charger.connect()
charger.all_properties  # Dict of all current properties
charger.properties_initialized  # Boolean - all properties loaded
unsub = charger.on_property_change(async_callback)  # Subscribe to updates
```

## Configuration & Standards

**Home Assistant Integration Rules**

- Always use `entry.runtime_data` for storing runtime state (not `hass.data[DOMAIN]`)
- Use `DataUpdateCoordinator` for coordinated entity updates
- Use `ConfigEntry` typed as `WattpilotConfigEntry` with runtime data
- Entities must inherit from `CoordinatorEntity` and implement `available` property
- Use translation keys for user-facing strings (defined in `strings.json`)

**Code Quality**

- Pre-commit hooks enforce ruff formatting, codespell, YAML linting, and JSON validation
- Tests require 90%+ coverage (configured in `pyproject.toml`)
- pytest configuration in `pyproject.toml` under `[tool.pytest.ini_options]`
- All code must pass ruff format and ruff check

**Testing**

- Test fixtures in `tests/conftest.py` provide mocked Home Assistant and charger instances
- Use `pytest-homeassistant-custom-component` for Home Assistant test utilities
- Tests are in `tests/` and mirror the structure of `custom_components/wattpilot/`
- Async tests use `pytest-asyncio` with `asyncio_mode = "auto"`

## Important Files

- `manifest.json`: Integration metadata, dependencies, version
- `strings.json`: User-facing text and translations
- `icons.json`: Custom icons for entities
- `quality_scale.yaml`: Home Assistant quality scale compliance checklist
- `services.yaml`: Service definitions for Home Assistant
- `descriptions.py`: Dataclass entity descriptions (replaces per-platform YAML entity files)
- `.pre-commit-config.yaml`: Pre-commit hooks configuration

## Services

The integration provides custom services defined in `services.py`:

- `wattpilot.set_next_trip`: Configure next trip departure time
- `wattpilot.set_goe_cloud`: Set go-eCharger cloud settings
- `wattpilot.disconnect_charger`: Manually disconnect
- `wattpilot.reconnect_charger`: Manually reconnect

Services are registered once in `async_setup` (quality scale `action-setup`), validate input with schemas, and raise translated `ServiceValidationError` / `HomeAssistantError`.

## Dashboard Cards (`frontend/`)

- TypeScript 7 + Lit 3, bundled by Vite into the committed `custom_components/wattpilot/frontend/wattpilot-cards.js`
- `frontend.py` serves the bundle and registers it as a Lovelace resource (storage mode) or extra JS URL (YAML mode), versioned by integration version + content hash
- Cards resolve entities by device and `translation_key` (`frontend/src/entities.ts`); keep those keys in sync with `descriptions.py`
- Verify with `npm run typecheck`, `npm test` and `npm run build` in `frontend/`, and commit the rebuilt bundle

## Common Patterns

**Adding a New Entity**

1. Find the charger API key in [go-eCharger API v2 documentation](https://github.com/goecharger/go-eCharger-API-v2/blob/main/apikeys-en.md)
2. Add entity description to `descriptions.py` (e.g., `WattpilotSensorEntityDescription`)
3. Add description to appropriate `XXX_DESCRIPTIONS` list in `descriptions.py`
4. Platform's `async_setup_entry` automatically creates entity from description via `filter_descriptions()`
5. Add tests in `tests/test_<platform>.py`

**Accessing Charger Data**

```python
from .utils import GetChargerProp, async_GetChargerProp

# Sync access (in __init__ or properties)
value = GetChargerProp(self._charger, "property_id", default_value)

# Async access (in async methods)
value = await async_GetChargerProp(self._charger, "property_id", default_value)
```

**Coordinator Usage**

```python
# In entity class
@property
def native_value(self):
    """Return sensor value from coordinator data."""
    if self.coordinator.data is None:
        return self._default_state
    return self.coordinator.data.get(self._identifier, self._default_state)


@property
def available(self) -> bool:
    """Return entity availability based on coordinator."""
    return self.coordinator.available and not self._init_failed
```

## Boundaries and Safety Constraints

- Always: Write tests for any new or modified functionality, verify changes locally, and update CHANGELOG.md under `[Unreleased]`.
- Ask first: Major architectural changes, removing public APIs, or adding heavy external dependencies.
- Never: Commit secrets, credentials, API keys, or private certificates. Never commit directly to `main`.

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
