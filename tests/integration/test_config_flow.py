"""Config flow tests against a real Home Assistant instance."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.config_entries import SOURCE_USER
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import device_registry as dr
from pytest_homeassistant_custom_component.common import MockConfigEntry
from wattpilot_api import AuthenticationError, WattpilotError

from custom_components.wattpilot.const import CONF_CONNECTION, CONF_LOCAL, DOMAIN

from .conftest import ENTRY_DATA

if TYPE_CHECKING:
    from collections.abc import Generator

    from homeassistant.core import HomeAssistant

LOCAL_INPUT: dict[str, Any] = {
    "friendly_name": "Garage",
    "ip_address": "192.168.1.100",
    "password": "secret",
    "timeout": 15,
}
CLOUD_INPUT: dict[str, Any] = {
    "friendly_name": "Garage",
    "serial": "12345678",
    "password": "secret",
    "timeout": 15,
}


@pytest.fixture
def flow_connect() -> Generator[AsyncMock]:
    """Patch the flow's connection test; the charger reports serial 12345678."""
    charger = MagicMock(serial="12345678")
    charger.disconnect = AsyncMock()
    with patch(
        "custom_components.wattpilot.config_flow.async_connect_new_charger",
        AsyncMock(return_value=charger),
    ) as connect:
        yield connect


@pytest.fixture(autouse=True)
def no_entry_setup() -> Generator[AsyncMock]:
    """Keep created entries from connecting to a charger."""
    with patch(
        "custom_components.wattpilot.async_setup_entry", AsyncMock(return_value=True)
    ) as setup:
        yield setup


async def _start(hass: HomeAssistant, step: str) -> dict[str, Any]:
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.MENU
    assert result["menu_options"] == ["local", "cloud"]
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"next_step_id": step}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == step
    return result


async def test_local_flow_creates_entry(
    hass: HomeAssistant, flow_connect: AsyncMock
) -> None:
    """A reachable local charger is added under its serial number."""
    result = await _start(hass, "local")
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], LOCAL_INPUT
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Garage"
    assert result["data"] == {**LOCAL_INPUT, CONF_CONNECTION: CONF_LOCAL}
    assert result["result"].unique_id == "12345678"
    flow_connect.return_value.disconnect.assert_awaited_once()


async def test_cloud_flow_creates_entry(
    hass: HomeAssistant, flow_connect: AsyncMock
) -> None:
    """A cloud charger is added with the cloud connection type."""
    result = await _start(hass, "cloud")
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], CLOUD_INPUT
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"][CONF_CONNECTION] == "cloud"


@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (AuthenticationError("bad"), {"base": "invalid_auth"}),
        (WattpilotError("timeout"), {"base": "cannot_connect"}),
        (OSError("refused"), {"base": "cannot_connect"}),
        (RuntimeError("bug"), {"base": "unknown"}),
    ],
)
async def test_local_flow_errors_then_recovers(
    hass: HomeAssistant,
    flow_connect: AsyncMock,
    error: Exception,
    expected: dict[str, str],
) -> None:
    """Connection errors are shown on the form and the user can retry."""
    result = await _start(hass, "local")
    flow_connect.side_effect = error
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], LOCAL_INPUT
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == expected

    flow_connect.side_effect = None
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], LOCAL_INPUT
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY


async def test_local_flow_invalid_ip(
    hass: HomeAssistant, flow_connect: AsyncMock
) -> None:
    """An invalid IP address is rejected before connecting."""
    result = await _start(hass, "local")
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**LOCAL_INPUT, "ip_address": "not-an-ip"}
    )

    assert result["errors"] == {"ip_address": "invalid_ip"}
    flow_connect.assert_not_awaited()


async def test_flow_aborts_for_configured_host(
    hass: HomeAssistant, config_entry: MockConfigEntry, flow_connect: AsyncMock
) -> None:
    """The same IP address cannot be added twice."""
    config_entry.add_to_hass(hass)
    result = await _start(hass, "local")
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], LOCAL_INPUT
    )

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"


async def test_flow_aborts_for_configured_serial(
    hass: HomeAssistant, config_entry: MockConfigEntry, flow_connect: AsyncMock
) -> None:
    """The same charger reached through another address is a duplicate."""
    config_entry.add_to_hass(hass)
    result = await _start(hass, "local")
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**LOCAL_INPUT, "ip_address": "192.168.1.200"}
    )

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"


async def test_reconfigure_keeps_password_when_blank(
    hass: HomeAssistant, config_entry: MockConfigEntry, flow_connect: AsyncMock
) -> None:
    """Reconfigure updates the host and keeps the stored password."""
    config_entry.add_to_hass(hass)
    result = await config_entry.start_reconfigure_flow(hass)
    assert result["step_id"] == "reconfigure"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {"friendly_name": "Garage 2", "ip_address": "192.168.1.150", "timeout": 20},
    )

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"
    assert config_entry.data["ip_address"] == "192.168.1.150"
    assert config_entry.data["password"] == ENTRY_DATA["password"]
    assert config_entry.title == "Garage 2"


async def test_reconfigure_rejects_other_charger(
    hass: HomeAssistant, config_entry: MockConfigEntry, flow_connect: AsyncMock
) -> None:
    """Reconfigure cannot point an entry at a different charger."""
    flow_connect.return_value.serial = "99999999"
    config_entry.add_to_hass(hass)
    result = await config_entry.start_reconfigure_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**LOCAL_INPUT, "ip_address": "192.168.1.150"}
    )

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "wrong_device"


async def test_reconfigure_shows_errors(
    hass: HomeAssistant, config_entry: MockConfigEntry, flow_connect: AsyncMock
) -> None:
    """A failed connection keeps the reconfigure form open."""
    flow_connect.side_effect = OSError("refused")
    config_entry.add_to_hass(hass)
    result = await config_entry.start_reconfigure_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], LOCAL_INPUT
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "cannot_connect"}


async def test_reauth_updates_password(
    hass: HomeAssistant, config_entry: MockConfigEntry, flow_connect: AsyncMock
) -> None:
    """Reauth stores the new password after a successful connection."""
    config_entry.add_to_hass(hass)
    result = await config_entry.start_reauth_flow(hass)
    assert result["step_id"] == "reauth_confirm"

    flow_connect.side_effect = AuthenticationError("still wrong")
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"password": "wrong"}
    )
    assert result["errors"] == {"base": "invalid_auth"}

    flow_connect.side_effect = None
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"password": "new-secret"}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reauth_successful"
    assert config_entry.data["password"] == "new-secret"


async def test_reconfigure_legacy_entry_migrates_unique_id(
    hass: HomeAssistant, flow_connect: AsyncMock
) -> None:
    """An entry keyed by its IP address is re-keyed by the charger serial."""
    entry = MockConfigEntry(
        domain=DOMAIN, title="Garage", unique_id="192.168.1.100", data=dict(ENTRY_DATA)
    )
    entry.add_to_hass(hass)
    result = await entry.start_reconfigure_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**LOCAL_INPUT, "ip_address": "192.168.1.150"}
    )

    assert result["reason"] == "reconfigure_successful"
    assert entry.unique_id == "12345678"


async def test_reconfigure_legacy_entry_rejects_other_device(
    hass: HomeAssistant, flow_connect: AsyncMock
) -> None:
    """A legacy entry that owns a charger device cannot switch to another one."""
    entry = MockConfigEntry(
        domain=DOMAIN, title="Garage", unique_id="192.168.1.100", data=dict(ENTRY_DATA)
    )
    entry.add_to_hass(hass)
    dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id, identifiers={(DOMAIN, "87654321")}
    )
    result = await entry.start_reconfigure_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**LOCAL_INPUT, "ip_address": "192.168.1.150"}
    )

    assert result["reason"] == "wrong_device"
    assert entry.unique_id == "192.168.1.100"
