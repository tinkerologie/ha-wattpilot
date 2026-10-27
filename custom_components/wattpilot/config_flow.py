"""Config flow for Fronius Wattpilot."""

from __future__ import annotations

import ipaddress
import logging
from typing import TYPE_CHECKING, Any, Final

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult
from homeassistant.const import (
    CONF_FRIENDLY_NAME,
    CONF_IP_ADDRESS,
    CONF_PASSWORD,
    CONF_TIMEOUT,
)
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.service_info.zeroconf import ZeroconfServiceInfo
from wattpilot_api import AuthenticationError, WattpilotError

from .configuration_schema import (
    REAUTH_SCHEMA,
    cloud_schema,
    discovery_schema,
    local_schema,
)
from .const import (
    CONF_CLOUD,
    CONF_CONNECTION,
    CONF_LOCAL,
    CONF_SERIAL,
    DEFAULT_NAME,
    DEFAULT_TIMEOUT,
    DOMAIN,
)
from .utils import async_connect_new_charger, async_DisconnectCharger

if TYPE_CHECKING:
    from collections.abc import Mapping

_LOGGER: Final = logging.getLogger(__name__)


def _valid_ip(value: str) -> bool:
    """Return True if value is a valid IPv4/IPv6 address."""
    try:
        ipaddress.ip_address(value)
    except ValueError:
        return False
    return True


class ConfigFlowHandler(ConfigFlow, domain=DOMAIN):
    """Config flow for a Wattpilot charger over the LAN or the Fronius cloud."""

    VERSION = 1

    _discovered: dict[str, str]

    async def _async_try_connect(
        self, data: Mapping[str, Any]
    ) -> tuple[str | None, dict[str, str]]:
        """Connect once with the given settings; return the serial or form errors."""
        if data.get(CONF_CONNECTION, CONF_LOCAL) == CONF_LOCAL and not _valid_ip(
            str(data.get(CONF_IP_ADDRESS, ""))
        ):
            return None, {CONF_IP_ADDRESS: "invalid_ip"}
        try:
            charger = await async_connect_new_charger(self.hass, data)
        except AuthenticationError:
            return None, {"base": "invalid_auth"}
        except (WattpilotError, OSError, TimeoutError, ValueError) as err:
            _LOGGER.debug("Cannot connect to Wattpilot: %s", err)
            return None, {"base": "cannot_connect"}
        except Exception:
            _LOGGER.exception("Unexpected error connecting to Wattpilot")
            return None, {"base": "unknown"}
        serial = str(charger.serial) if getattr(charger, "serial", None) else None
        await async_DisconnectCharger(self.flow_id, charger)
        return serial, {}

    async def async_step_user(
        self,
        user_input: dict[str, Any] | None = None,  # noqa: ARG002
    ) -> ConfigFlowResult:
        """Let the user pick a local or cloud connection."""
        return self.async_show_menu(
            step_id="user", menu_options=[CONF_LOCAL, CONF_CLOUD]
        )

    async def async_step_zeroconf(
        self, discovery_info: ZeroconfServiceInfo
    ) -> ConfigFlowResult:
        """Handle a Wattpilot announcing itself over mDNS."""
        serial = str(discovery_info.properties.get("serial") or "")
        if not serial or not isinstance(
            discovery_info.ip_address, ipaddress.IPv4Address
        ):
            return self.async_abort(reason="not_wattpilot")
        host = str(discovery_info.ip_address)

        await self.async_set_unique_id(serial)
        entry = self.hass.config_entries.async_entry_for_domain_unique_id(
            DOMAIN, serial
        )
        if (
            entry is not None
            and entry.data.get(CONF_CONNECTION, CONF_LOCAL) != CONF_LOCAL
        ):
            return self.async_abort(reason="already_configured")
        # Keep the address of a configured local charger current (DHCP changes).
        self._abort_if_unique_id_configured(updates={CONF_IP_ADDRESS: host})
        # Entries created before 2026.10.2 may still be keyed by IP address.
        self._async_abort_entries_match({CONF_IP_ADDRESS: host})

        name = str(discovery_info.properties.get("friendly_name") or DEFAULT_NAME)
        self._discovered = {"name": name, "host": host, "serial": serial}
        self.context["title_placeholders"] = {"name": f"{name} ({serial})"}
        return await self.async_step_zeroconf_confirm()

    async def async_step_zeroconf_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Ask for the password of a discovered charger."""
        errors: dict[str, str] = {}
        if user_input is not None:
            data = {
                CONF_FRIENDLY_NAME: user_input[CONF_FRIENDLY_NAME],
                CONF_IP_ADDRESS: self._discovered["host"],
                CONF_PASSWORD: user_input[CONF_PASSWORD],
                CONF_TIMEOUT: DEFAULT_TIMEOUT,
                CONF_CONNECTION: CONF_LOCAL,
            }
            _, errors = await self._async_try_connect(data)
            if not errors:
                return self.async_create_entry(
                    title=data[CONF_FRIENDLY_NAME], data=data
                )
        return self.async_show_form(
            step_id="zeroconf_confirm",
            data_schema=discovery_schema(self._discovered["name"]),
            errors=errors,
            description_placeholders={
                "serial": self._discovered["serial"],
                "host": self._discovered["host"],
            },
        )

    async def async_step_local(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Configure a local connection."""
        return await self._async_step_connection(CONF_LOCAL, user_input)

    async def async_step_cloud(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Configure a cloud connection."""
        return await self._async_step_connection(CONF_CLOUD, user_input)

    async def _async_step_connection(
        self, connection: str, user_input: dict[str, Any] | None
    ) -> ConfigFlowResult:
        schema = local_schema if connection == CONF_LOCAL else cloud_schema
        errors: dict[str, str] = {}
        if user_input is not None:
            data = {**user_input, CONF_CONNECTION: connection}
            host_key = CONF_IP_ADDRESS if connection == CONF_LOCAL else CONF_SERIAL
            self._async_abort_entries_match({host_key: data[host_key]})
            serial, errors = await self._async_try_connect(data)
            if not errors:
                await self.async_set_unique_id(serial or data[host_key])
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=data[CONF_FRIENDLY_NAME], data=data
                )
        return self.async_show_form(
            step_id=connection,
            data_schema=self.add_suggested_values_to_schema(schema(), user_input),
            errors=errors,
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Change the connection settings of an existing charger."""
        entry = self._get_reconfigure_entry()
        connection = entry.data.get(CONF_CONNECTION, CONF_LOCAL)
        schema = local_schema if connection == CONF_LOCAL else cloud_schema
        errors: dict[str, str] = {}
        if user_input is not None:
            data = {**entry.data, **user_input, CONF_CONNECTION: connection}
            if not user_input.get(CONF_PASSWORD):
                data[CONF_PASSWORD] = entry.data.get(CONF_PASSWORD)
            serial, errors = await self._async_try_connect(data)
            if not errors:
                if serial and self._is_other_charger(entry, serial):
                    return self.async_abort(reason="wrong_device")
                if serial and serial != entry.unique_id:
                    other = self.hass.config_entries.async_entry_for_domain_unique_id(
                        DOMAIN, serial
                    )
                    if other is not None and other.entry_id != entry.entry_id:
                        return self.async_abort(reason="already_configured")
                return self.async_update_reload_and_abort(
                    entry,
                    unique_id=serial or entry.unique_id,
                    title=data[CONF_FRIENDLY_NAME],
                    data=data,
                )
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=schema(user_input or entry.data, password_required=False),
            errors=errors,
        )

    def _is_other_charger(self, entry: ConfigEntry, serial: str) -> bool:
        """Return True if `serial` is not the charger this entry already manages."""
        owned = {
            identifier
            for device in dr.async_entries_for_config_entry(
                dr.async_get(self.hass), entry.entry_id
            )
            for domain, identifier in device.identifiers
            if domain == DOMAIN
        }
        if owned:
            return serial not in owned
        # Entries created before 2026.10.2 used the IP address or name as unique id.
        return entry.unique_id not in (
            serial,
            entry.data.get(CONF_IP_ADDRESS),
            entry.data.get(CONF_FRIENDLY_NAME),
        )

    async def async_step_reauth(
        self,
        entry_data: Mapping[str, Any],  # noqa: ARG002
    ) -> ConfigFlowResult:
        """Start reauthentication after the charger rejected the password."""
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Ask for the new charger password."""
        entry = self._get_reauth_entry()
        errors: dict[str, str] = {}
        if user_input is not None:
            data = {**entry.data, CONF_PASSWORD: user_input[CONF_PASSWORD]}
            _, errors = await self._async_try_connect(data)
            if not errors:
                return self.async_update_reload_and_abort(entry, data=data)
        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=REAUTH_SCHEMA,
            errors=errors,
            description_placeholders={"name": entry.title},
        )
