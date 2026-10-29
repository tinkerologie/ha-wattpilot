"""Fixtures for Fronius Wattpilot integration tests."""

from __future__ import annotations

import sys
from typing import TYPE_CHECKING, Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from wattpilot_api import exceptions as _exceptions

from .fixtures import get_charger_properties
from .fixtures.deprecations import HANDLER as DEPRECATION_REPORTS

if TYPE_CHECKING:
    from collections.abc import Generator

# Conditional imports for constants (avoid import resolution issues in CI)
CONF_FRIENDLY_NAME = "friendly_name"
CONF_IP_ADDRESS = "ip_address"
CONF_PASSWORD = "password"


def _create_mock_wattpilot_api_module() -> MagicMock:
    """Create a mock wattpilot_api module to avoid websocket dependency."""
    mock_module = MagicMock()

    # Mock Wattpilot class
    mock_wattpilot_class = MagicMock()
    mock_module.Wattpilot = mock_wattpilot_class

    # Mock LoadMode enum
    mock_load_mode = MagicMock()
    mock_load_mode.DEFAULT = 3
    mock_load_mode.ECO = 4
    mock_load_mode.NEXTTRIP = 5
    mock_module.LoadMode = mock_load_mode

    # Mock CarStatus enum
    mock_car_status = MagicMock()
    mock_car_status.NO_CAR = 1
    mock_car_status.CHARGING = 2
    mock_car_status.READY = 3
    mock_car_status.COMPLETE = 4
    mock_module.CarStatus = mock_car_status

    # Mock ErrorState enum
    mock_error_state = MagicMock()
    mock_error_state.IDLE = 0
    mock_error_state.CHARGING = 1
    mock_error_state.ERROR = 5
    mock_module.ErrorState = mock_error_state

    # Mock AccessState enum
    mock_access_state = MagicMock()
    mock_access_state.OPEN = 0
    mock_access_state.WAIT = 1
    mock_module.AccessState = mock_access_state

    # Mock CableLockMode enum
    mock_cable_lock = MagicMock()
    mock_cable_lock.NORMAL = 0
    mock_cable_lock.AUTO_UNLOCK = 1
    mock_cable_lock.ALWAYS_LOCK = 2
    mock_module.CableLockMode = mock_cable_lock

    # The library's real exception classes, so `except` clauses match no matter
    # whether a module imported wattpilot_api before or after this mock.
    mock_module.WattpilotError = _exceptions.WattpilotError
    mock_module.AuthenticationError = _exceptions.AuthenticationError
    mock_module.ConnectionError = _exceptions.ConnectionError

    # Set version
    mock_module.__version__ = "1.0.0"

    return mock_module


# Install mock wattpilot_api module before any imports
_mock_wattpilot_api = _create_mock_wattpilot_api_module()
sys.modules["wattpilot_api"] = _mock_wattpilot_api

# Now we can import from the integration
from custom_components.wattpilot.const import (
    CONF_CONNECTION,
    CONF_LOCAL,
    CONF_SERIAL,
    DOMAIN,
)


@pytest.fixture(autouse=True)
def fail_on_ha_deprecation_reports() -> Generator[None]:
    """
    Fail when Home Assistant logs deprecated use by this integration.

    Home Assistant logs, rather than warns, when an integration calls a
    deprecated API or an entity class defines a deprecated attribute. Autouse
    fixtures are set up first, so this one is torn down after ``hass``, and
    reports logged while Home Assistant stops still count. Reports logged while
    modules were imported surface on the first test.
    """
    yield
    if reports := DEPRECATION_REPORTS.pop_reports():
        pytest.fail(
            "Home Assistant reported deprecated use by wattpilot:\n"
            + "\n".join(reports),
            pytrace=False,
        )


@pytest.fixture
def mock_hass() -> MagicMock:
    """Create a mock Home Assistant instance."""
    hass = MagicMock()
    hass.loop = MagicMock()
    hass.data = {}

    def _create_task(target: Any, *args: Any, **kwargs: Any) -> None:
        # The mock never runs scheduled work; close coroutines so none leak.
        if hasattr(target, "close"):
            target.close()

    hass.async_create_task = MagicMock(side_effect=_create_task)

    async def _executor_job(target: Any, *args: Any) -> Any:
        return target(*args)

    hass.async_add_executor_job = AsyncMock(side_effect=_executor_job)

    # Create a proper event bus mock
    bus = MagicMock()
    bus.async_fire = AsyncMock()
    bus.fire = MagicMock()
    hass.bus = bus

    # Add config_entries mock
    hass.config_entries = MagicMock()
    hass.config_entries.async_forward_entry_setups = AsyncMock(return_value=True)
    hass.config_entries.async_unload_platforms = AsyncMock(return_value=True)
    hass.config_entries.async_update_entry = MagicMock()
    hass.config_entries.async_reload = AsyncMock()
    hass.config_entries.async_get_entry = MagicMock(return_value=None)

    # Add services mock
    hass.services = MagicMock()
    hass.services.async_register = MagicMock()
    hass.services.has_service = MagicMock(return_value=False)

    return hass


@pytest.fixture
def hass(mock_hass: MagicMock) -> MagicMock:
    """Alias for mock_hass for compatibility."""
    return mock_hass


@pytest.fixture
def mock_coordinator(mock_hass: MagicMock, mock_charger: MagicMock) -> MagicMock:
    """Create a mock coordinator instance."""
    coordinator = MagicMock()
    coordinator.hass = mock_hass
    coordinator.charger = mock_charger
    coordinator.data = mock_charger.all_properties
    coordinator.last_update_success = True
    coordinator.async_config_entry_first_refresh = AsyncMock()
    coordinator.async_set_updated_data = MagicMock()
    coordinator.async_handle_property_update = MagicMock()
    return coordinator


@pytest.fixture
def mock_config_entry_data() -> dict[str, Any]:
    """Return mock config entry data."""
    return {
        CONF_FRIENDLY_NAME: "Test Wattpilot",
        CONF_IP_ADDRESS: "192.168.1.100",
        CONF_PASSWORD: "test_password",
        CONF_CONNECTION: CONF_LOCAL,
        CONF_SERIAL: "12345678",
    }


@pytest.fixture
def mock_charger() -> MagicMock:
    """Create a mock charger instance using fixture data."""
    charger = MagicMock()

    # Load properties from fixture file
    properties = get_charger_properties()

    # Basic charger properties
    charger.serial = properties.get("sse", "12345678")
    charger.name = properties.get("fna", "Test Wattpilot")
    charger.firmware = properties.get("onv", "40.7")
    charger.connected = True
    charger.properties_initialized = True
    charger.manufacturer = "Fronius"
    charger.device_type = properties.get("typ", "go-eCharger HOME+ 11kW")
    # Strings like the library's, not MagicMock attributes: Home Assistant
    # reports a non-string model passed to the device registry.
    charger.model = charger.device_type
    charger.variant = properties.get("var", 11)
    charger.hostname = f"wattpilot-{charger.serial}"

    # Mock all_properties dictionary with properties from fixture
    charger.all_properties = properties

    # Mock charger attributes
    charger.access_state = "open"
    charger.car_connected = "no car"

    # Mock methods
    charger.set_power = AsyncMock()
    charger.set_property = AsyncMock()
    charger.set_mode = AsyncMock()
    charger.connect = AsyncMock()
    charger.disconnect = AsyncMock()

    # Per-client API definition cache (warmed in the executor before connect)
    charger._api_def_cache = None
    charger._get_api_def = MagicMock(return_value={})

    # Mock on_property_change - returns an unsubscribe callable
    _unsub = MagicMock()
    charger.on_property_change = MagicMock(return_value=_unsub)
    charger.on_message = MagicMock(return_value=MagicMock())

    return charger


@pytest.fixture
def mock_wattpilot_module() -> Generator[MagicMock]:
    """Mock the wattpilot_api module."""
    # Use the existing mock already injected into sys.modules
    return _mock_wattpilot_api


@pytest.fixture
def mock_setup_entry() -> Generator[AsyncMock]:
    """Override async_setup_entry."""
    with patch(
        f"custom_components.{DOMAIN}.async_setup_entry",
        return_value=True,
    ) as mock_setup:
        yield mock_setup


def get_charger_prop(charger: MagicMock, prop: str, default: Any = None) -> Any:
    """Get a property from the mock charger."""
    return charger.all_properties.get(prop, default)


async def async_get_charger_prop(
    charger: MagicMock, prop: str, default: Any = None
) -> Any:
    """Async get a property from the mock charger."""
    return charger.all_properties.get(prop, default)


async def async_set_charger_prop(charger: MagicMock, prop: str, value: Any) -> None:
    """Async set a property on the mock charger."""
    charger.all_properties[prop] = value


@pytest.fixture
def mock_charger_functions(mock_charger: MagicMock) -> Generator[None]:
    """Mock charger property functions."""
    with (
        patch(
            "custom_components.wattpilot.utils.GetChargerProp",
            side_effect=lambda c, p, d=None: get_charger_prop(c, p, d),
        ),
        patch(
            "custom_components.wattpilot.utils.async_GetChargerProp",
            side_effect=lambda c, p, d=None: async_get_charger_prop(c, p, d),
        ),
        patch(
            "custom_components.wattpilot.utils.async_SetChargerProp",
            side_effect=async_set_charger_prop,
        ),
    ):
        yield


@pytest.fixture
def mock_connect_charger(mock_charger: MagicMock) -> Generator[AsyncMock]:
    """Mock async_ConnectCharger to return our mock charger."""
    with (
        patch(
            "custom_components.wattpilot.async_ConnectCharger",
            return_value=mock_charger,
        ) as mock_connect,
        patch(
            "custom_components.wattpilot.utils.async_ConnectCharger",
            return_value=mock_charger,
        ),
    ):
        yield mock_connect


@pytest.fixture
def mock_disconnect_charger() -> Generator[AsyncMock]:
    """Mock async_DisconnectCharger."""
    with (
        patch(
            "custom_components.wattpilot.async_DisconnectCharger",
            return_value=None,
        ) as mock_disconnect,
        patch(
            "custom_components.wattpilot.utils.async_DisconnectCharger",
            return_value=None,
        ),
    ):
        yield mock_disconnect


@pytest.fixture
def mock_config_entry(
    mock_config_entry_data: dict, mock_coordinator: MagicMock, mock_charger: MagicMock
) -> Any:
    """Create a mock config entry with runtime_data."""
    from homeassistant.config_entries import ConfigEntry

    from custom_components.wattpilot.types import WattpilotRuntimeData

    entry = ConfigEntry(
        version=1,
        minor_version=0,
        domain=DOMAIN,
        title="Test Wattpilot",
        data=mock_config_entry_data,
        source="user",
        unique_id="12345678",
        discovery_keys={},
        options={},
        subentries_data={},
    )

    # Add runtime_data
    entry.runtime_data = WattpilotRuntimeData(
        charger=mock_charger,
        coordinator=mock_coordinator,
        push_entities={},
        params=mock_config_entry_data,
    )

    return entry
