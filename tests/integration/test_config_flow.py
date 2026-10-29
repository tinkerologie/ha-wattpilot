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


async def test_reconfigure_legacy_entry_rejects_serial_of_other_entry(
    hass: HomeAssistant, config_entry: MockConfigEntry, flow_connect: AsyncMock
) -> None:
    """A legacy entry cannot take over a charger that another entry manages."""
    config_entry.add_to_hass(hass)
    legacy = MockConfigEntry(
        domain=DOMAIN,
        title="Old",
        unique_id="192.168.1.150",
        data={**ENTRY_DATA, "ip_address": "192.168.1.150"},
    )
    legacy.add_to_hass(hass)
    result = await legacy.start_reconfigure_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**LOCAL_INPUT, "ip_address": "192.168.1.150"}
    )

    assert result["reason"] == "already_configured"
    assert legacy.unique_id == "192.168.1.150"


async def test_reauth_entry_without_connection_key(
    hass: HomeAssistant, flow_connect: AsyncMock
) -> None:
    """Old entries without a stored connection type reauthenticate as local."""
    data = {key: value for key, value in ENTRY_DATA.items() if key != CONF_CONNECTION}
    entry = MockConfigEntry(domain=DOMAIN, title="Old", unique_id="12345678", data=data)
    entry.add_to_hass(hass)
    result = await entry.start_reauth_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"password": "new-secret"}
    )

    assert result["reason"] == "reauth_successful"
    assert entry.data["password"] == "new-secret"


def _zeroconf(host: str = "192.168.1.100", serial: str = "12345678") -> Any:
    from ipaddress import ip_address

    from homeassistant.helpers.service_info.zeroconf import ZeroconfServiceInfo

    return ZeroconfServiceInfo(
        ip_address=ip_address(host),
        ip_addresses=[ip_address(host)],
        port=80,
        hostname=f"Wattpilot_{serial}.local.",
        type="_http._tcp.local.",
        name="Wattpilot._http._tcp.local.",
        properties={
            "devicefamily": "wattpilot",
            "friendly_name": "Wattpilot",
            "serial": serial,
        },
    )


async def test_zeroconf_discovery_creates_entry(
    hass: HomeAssistant, flow_connect: AsyncMock
) -> None:
    """A discovered charger only asks for its password."""
    from homeassistant.config_entries import SOURCE_ZEROCONF

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_ZEROCONF}, data=_zeroconf()
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "zeroconf_confirm"
    assert result["description_placeholders"] == {
        "serial": "12345678",
        "host": "192.168.1.100",
    }

    flow_connect.side_effect = AuthenticationError("bad")
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"friendly_name": "Garage", "password": "wrong"}
    )
    assert result["errors"] == {"base": "invalid_auth"}

    flow_connect.side_effect = None
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"friendly_name": "Garage", "password": "secret"}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["result"].unique_id == "12345678"
    assert result["data"]["ip_address"] == "192.168.1.100"
    assert result["data"][CONF_CONNECTION] == CONF_LOCAL


async def test_zeroconf_updates_address_of_configured_charger(
    hass: HomeAssistant, config_entry: MockConfigEntry
) -> None:
    """A known charger that moved to a new address is updated and not re-added."""
    from homeassistant.config_entries import SOURCE_ZEROCONF

    config_entry.add_to_hass(hass)
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_ZEROCONF}, data=_zeroconf("192.168.1.42")
    )

    assert result["reason"] == "already_configured"
    assert config_entry.data["ip_address"] == "192.168.1.42"


async def test_zeroconf_leaves_cloud_entries_alone(hass: HomeAssistant) -> None:
    """A charger configured through the cloud keeps its cloud settings."""
    from homeassistant.config_entries import SOURCE_ZEROCONF

    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id="12345678",
        data={**CLOUD_INPUT, CONF_CONNECTION: "cloud"},
    )
    entry.add_to_hass(hass)
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_ZEROCONF}, data=_zeroconf()
    )

    assert result["reason"] == "already_configured"
    assert "ip_address" not in entry.data


async def test_zeroconf_matches_legacy_entry_by_address(hass: HomeAssistant) -> None:
    """An entry still keyed by IP address is not discovered again."""
    from homeassistant.config_entries import SOURCE_ZEROCONF

    MockConfigEntry(
        domain=DOMAIN, unique_id="192.168.1.100", data=dict(ENTRY_DATA)
    ).add_to_hass(hass)
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_ZEROCONF}, data=_zeroconf()
    )

    assert result["reason"] == "already_configured"


@pytest.mark.parametrize(
    ("host", "serial"), [("192.168.1.100", ""), ("fe80::1", "12345678")]
)
async def test_zeroconf_ignores_unusable_announcements(
    hass: HomeAssistant, host: str, serial: str
) -> None:
    """Announcements without a serial or with only IPv6 are ignored."""
    from homeassistant.config_entries import SOURCE_ZEROCONF

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_ZEROCONF}, data=_zeroconf(host, serial)
    )

    assert result["reason"] == "not_wattpilot"


async def test_zeroconf_prefers_ipv4_from_dual_stack_announcement(
    hass: HomeAssistant, flow_connect: AsyncMock
) -> None:
    """An IPv6 primary address falls back to the announced IPv4 address."""
    from ipaddress import ip_address

    from homeassistant.config_entries import SOURCE_ZEROCONF

    info = _zeroconf()
    info.ip_address = ip_address("fe80::1")
    info.ip_addresses = [ip_address("fe80::1"), ip_address("192.168.1.77")]
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_ZEROCONF}, data=info
    )

    assert result["step_id"] == "zeroconf_confirm"
    assert result["description_placeholders"]["host"] == "192.168.1.77"


async def test_zeroconf_keeps_address_announced_among_several(
    hass: HomeAssistant, config_entry: MockConfigEntry, no_entry_setup: AsyncMock
) -> None:
    """
    A charger on Ethernet and Wi-Fi announces both addresses in varying order.

    The configured address is kept, so repeated announcements never reload the
    entry and its entities don't drop to unavailable (#188).
    """
    from ipaddress import ip_address

    from homeassistant.config_entries import SOURCE_ZEROCONF

    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    no_entry_setup.reset_mock()

    for order in (
        ["192.168.1.55", "192.168.1.100"],
        ["192.168.1.100", "192.168.1.55"],
        ["192.168.1.55", "192.168.1.100"],
    ):
        info = _zeroconf(order[0])
        info.ip_addresses = [ip_address(host) for host in order]
        result = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": SOURCE_ZEROCONF}, data=info
        )
        await hass.async_block_till_done()

        assert result["reason"] == "already_configured"
        assert config_entry.data["ip_address"] == "192.168.1.100"

    no_entry_setup.assert_not_called()


async def test_zeroconf_reloads_once_when_address_really_changes(
    hass: HomeAssistant, config_entry: MockConfigEntry, no_entry_setup: AsyncMock
) -> None:
    """A charger that is no longer reachable at its address is moved and reloaded."""
    from homeassistant.config_entries import SOURCE_ZEROCONF

    config_entry.add_to_hass(hass)
    with patch(
        "custom_components.wattpilot.async_unload_entry", AsyncMock(return_value=True)
    ):
        assert await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()
        no_entry_setup.reset_mock()

        for _ in range(2):
            result = await hass.config_entries.flow.async_init(
                DOMAIN,
                context={"source": SOURCE_ZEROCONF},
                data=_zeroconf("192.168.1.42"),
            )
            await hass.async_block_till_done()
            assert result["reason"] == "already_configured"

    assert config_entry.data["ip_address"] == "192.168.1.42"
    no_entry_setup.assert_called_once()


async def test_zeroconf_skips_link_local_addresses(
    hass: HomeAssistant, flow_connect: AsyncMock
) -> None:
    """A link-local address of an unconfigured interface is never used."""
    from ipaddress import ip_address

    from homeassistant.config_entries import SOURCE_ZEROCONF

    info = _zeroconf("169.254.10.20")
    info.ip_addresses = [ip_address("169.254.10.20"), ip_address("192.168.1.77")]
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_ZEROCONF}, data=info
    )
    assert result["description_placeholders"]["host"] == "192.168.1.77"

    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={"source": SOURCE_ZEROCONF},
        data=_zeroconf("169.254.10.21", "87654321"),
    )
    assert result["reason"] == "not_wattpilot"
