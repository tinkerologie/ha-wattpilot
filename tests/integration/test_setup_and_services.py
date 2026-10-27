"""Setup, unload and service tests against a real Home Assistant instance."""

from __future__ import annotations

import datetime as dt
from typing import TYPE_CHECKING
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.config_entries import SOURCE_REAUTH, ConfigEntryState
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import device_registry as dr
from pytest_homeassistant_custom_component.common import MockConfigEntry
from wattpilot_api import AuthenticationError, WattpilotError

from custom_components.wattpilot.const import DOMAIN

from .conftest import ENTRY_DATA

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


async def _setup(hass: HomeAssistant, entry: MockConfigEntry) -> None:
    entry.add_to_hass(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()


def _device_id(hass: HomeAssistant, entry: MockConfigEntry) -> str:
    devices = dr.async_entries_for_config_entry(dr.async_get(hass), entry.entry_id)
    assert devices
    return devices[0].id


async def test_setup_and_unload(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    connect_charger: AsyncMock,
    mock_charger: MagicMock,
) -> None:
    """The entry loads, creates entities and disconnects on unload."""
    await _setup(hass, config_entry)

    assert config_entry.state is ConfigEntryState.LOADED
    connect_charger.assert_awaited_once()
    assert connect_charger.await_args.args[1] == config_entry.data
    assert hass.states.async_entity_ids("sensor")
    mock_charger.on_property_change.assert_called_once()
    for service in (
        "set_next_trip",
        "set_goe_cloud",
        "disconnect_charger",
        "reconnect_charger",
    ):
        assert hass.services.has_service(DOMAIN, service)

    assert await hass.config_entries.async_unload(config_entry.entry_id)
    assert config_entry.state is ConfigEntryState.NOT_LOADED
    mock_charger.disconnect.assert_awaited()
    mock_charger.on_property_change.return_value.assert_called_once()
    # Services are integration-wide and stay registered (action-setup rule).
    assert hass.services.has_service(DOMAIN, "set_next_trip")


async def test_setup_auth_failure_starts_reauth(
    hass: HomeAssistant, config_entry: MockConfigEntry
) -> None:
    """A rejected password puts the entry in error and starts reauth."""
    with patch(
        "custom_components.wattpilot.async_connect_new_charger",
        AsyncMock(side_effect=AuthenticationError("bad password")),
    ):
        await _setup(hass, config_entry)

    assert config_entry.state is ConfigEntryState.SETUP_ERROR
    flows = hass.config_entries.flow.async_progress_by_handler(DOMAIN)
    assert [flow["context"]["source"] for flow in flows] == [SOURCE_REAUTH]


@pytest.mark.parametrize("error", [WattpilotError("timeout"), OSError("refused")])
async def test_setup_connection_failure_retries(
    hass: HomeAssistant, config_entry: MockConfigEntry, error: Exception
) -> None:
    """Connection problems are retried later."""
    with patch(
        "custom_components.wattpilot.async_connect_new_charger",
        AsyncMock(side_effect=error),
    ):
        await _setup(hass, config_entry)

    assert config_entry.state is ConfigEntryState.SETUP_RETRY


async def test_setup_first_refresh_failure_disconnects(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    connect_charger: AsyncMock,
    mock_charger: MagicMock,
) -> None:
    """A charger that is not initialised is retried and its socket closed."""
    mock_charger.properties_initialized = False

    await _setup(hass, config_entry)

    assert config_entry.state is ConfigEntryState.SETUP_RETRY
    mock_charger.disconnect.assert_awaited_once()


async def test_platform_setup_failure_disconnects(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    connect_charger: AsyncMock,
    mock_charger: MagicMock,
) -> None:
    """If forwarding to platforms fails the charger connection is closed."""
    with patch.object(
        hass.config_entries,
        "async_forward_entry_setups",
        AsyncMock(side_effect=RuntimeError("boom")),
    ):
        await _setup(hass, config_entry)

    assert config_entry.state is ConfigEntryState.SETUP_ERROR
    mock_charger.disconnect.assert_awaited_once()


async def test_set_next_trip(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    connect_charger: AsyncMock,
    mock_charger: MagicMock,
) -> None:
    """set_next_trip passes a parsed time to the charger."""
    mock_charger.set_next_trip = AsyncMock()
    await _setup(hass, config_entry)

    await hass.services.async_call(
        DOMAIN,
        "set_next_trip",
        {"device_id": _device_id(hass, config_entry), "trigger_time": "06:30:00"},
        blocking=True,
    )

    mock_charger.set_next_trip.assert_awaited_once_with(dt.time(6, 30))


async def test_service_charger_error_raises(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    connect_charger: AsyncMock,
    mock_charger: MagicMock,
) -> None:
    """Library failures surface as translated HomeAssistantError."""
    mock_charger.set_next_trip = AsyncMock(side_effect=WattpilotError("nope"))
    await _setup(hass, config_entry)

    with pytest.raises(HomeAssistantError) as err:
        await hass.services.async_call(
            DOMAIN,
            "set_next_trip",
            {"device_id": _device_id(hass, config_entry), "trigger_time": "06:30"},
            blocking=True,
        )
    assert err.value.translation_key == "service_failed"


async def test_service_unknown_device(
    hass: HomeAssistant, config_entry: MockConfigEntry, connect_charger: AsyncMock
) -> None:
    """An unknown device id is a validation error."""
    await _setup(hass, config_entry)

    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            DOMAIN, "disconnect_charger", {"device_id": "missing"}, blocking=True
        )
    assert err.value.translation_key == "device_not_found"


async def test_service_foreign_device(
    hass: HomeAssistant, config_entry: MockConfigEntry, connect_charger: AsyncMock
) -> None:
    """A device of another integration is rejected."""
    await _setup(hass, config_entry)
    other = MockConfigEntry(domain="other")
    other.add_to_hass(hass)
    device = dr.async_get(hass).async_get_or_create(
        config_entry_id=other.entry_id, identifiers={("other", "x")}, name="Lamp"
    )

    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            DOMAIN, "disconnect_charger", {"device_id": device.id}, blocking=True
        )
    assert err.value.translation_key == "device_not_wattpilot"


async def test_service_entry_not_loaded(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    connect_charger: AsyncMock,
) -> None:
    """Calling a service for an unloaded charger is a validation error."""
    await _setup(hass, config_entry)
    device_id = _device_id(hass, config_entry)
    await hass.config_entries.async_unload(config_entry.entry_id)

    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            DOMAIN, "disconnect_charger", {"device_id": device_id}, blocking=True
        )
    assert err.value.translation_key == "entry_not_loaded"


async def test_set_goe_cloud(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    connect_charger: AsyncMock,
    mock_charger: MagicMock,
) -> None:
    """Enabling returns the cloud credentials; disabling reports the new state."""
    mock_charger.enable_cloud_api = AsyncMock(
        return_value=MagicMock(api_key="key", url="https://cloud")
    )
    mock_charger.disable_cloud_api = AsyncMock()
    await _setup(hass, config_entry)
    device_id = _device_id(hass, config_entry)

    enabled = await hass.services.async_call(
        DOMAIN,
        "set_goe_cloud",
        {"device_id": device_id, "cloud_api": True},
        blocking=True,
        return_response=True,
    )
    disabled = await hass.services.async_call(
        DOMAIN,
        "set_goe_cloud",
        {"device_id": device_id, "cloud_api": False},
        blocking=True,
        return_response=True,
    )

    assert enabled == {"enabled": True, "api_key": "key", "url": "https://cloud"}
    assert disabled == {"enabled": False}

    mock_charger.enable_cloud_api.side_effect = WattpilotError("offline")
    with pytest.raises(HomeAssistantError):
        await hass.services.async_call(
            DOMAIN,
            "set_goe_cloud",
            {"device_id": device_id, "cloud_api": True},
            blocking=True,
        )


async def test_disconnect_and_reconnect(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    connect_charger: AsyncMock,
    mock_charger: MagicMock,
) -> None:
    """disconnect/reconnect drive the charger connection."""
    await _setup(hass, config_entry)
    device_id = _device_id(hass, config_entry)
    mock_charger.disconnect.reset_mock()

    await hass.services.async_call(
        DOMAIN, "disconnect_charger", {"device_id": device_id}, blocking=True
    )
    mock_charger.disconnect.assert_awaited_once()

    with patch("custom_components.wattpilot.services.asyncio.sleep", AsyncMock()):
        await hass.services.async_call(
            DOMAIN, "reconnect_charger", {"device_id": device_id}, blocking=True
        )
    mock_charger.connect.assert_awaited()

    mock_charger.disconnect.side_effect = WattpilotError("socket")
    with pytest.raises(HomeAssistantError):
        await hass.services.async_call(
            DOMAIN, "disconnect_charger", {"device_id": device_id}, blocking=True
        )
    with pytest.raises(HomeAssistantError):
        await hass.services.async_call(
            DOMAIN, "reconnect_charger", {"device_id": device_id}, blocking=True
        )

    mock_charger.disconnect.side_effect = None
    mock_charger.connect.side_effect = WattpilotError("refused")
    with (
        patch("custom_components.wattpilot.services.asyncio.sleep", AsyncMock()),
        pytest.raises(HomeAssistantError) as err,
    ):
        await hass.services.async_call(
            DOMAIN, "reconnect_charger", {"device_id": device_id}, blocking=True
        )
    assert err.value.translation_key == "reconnect_failed"


async def test_property_push_updates_coordinator(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    connect_charger: AsyncMock,
    mock_charger: MagicMock,
) -> None:
    """Websocket pushes reach the coordinator through the registered callback."""
    await _setup(hass, config_entry)
    on_change = mock_charger.on_property_change.call_args.args[0]

    await on_change("amp", 12)

    assert config_entry.runtime_data.coordinator.data["amp"] == 12


async def test_setup_migrates_legacy_unique_id(
    hass: HomeAssistant, connect_charger: AsyncMock
) -> None:
    """Entries keyed by IP address are re-keyed by the charger serial on setup."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Garage",
        unique_id="192.168.1.100",
        data=dict(ENTRY_DATA),
    )
    other = MockConfigEntry(
        domain=DOMAIN, title="Other", unique_id="192.168.1.200", data={}
    )
    await _setup(hass, entry)
    assert entry.unique_id == "12345678"

    # A second legacy entry for the same charger keeps its id and logs a warning.
    other.add_to_hass(hass)
    from custom_components.wattpilot import _async_migrate_unique_id

    _async_migrate_unique_id(hass, other, "12345678")
    assert other.unique_id == "192.168.1.200"
