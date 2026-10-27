"""Init for the Fronius Wattpilot integration."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, Final

from homeassistant.const import CONF_FRIENDLY_NAME
from homeassistant.core import callback
from homeassistant.exceptions import ConfigEntryAuthFailed, ConfigEntryNotReady
from homeassistant.helpers import config_validation as cv
from wattpilot_api import AuthenticationError

from .const import DOMAIN, SUPPORTED_PLATFORMS
from .coordinator import WattpilotCoordinator
from .frontend import async_register_frontend
from .services import async_setup_services
from .types import WattpilotConfigEntry, WattpilotRuntimeData
from .utils import (
    async_connect_new_charger,
    async_DisconnectCharger,
    async_property_update_handler,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.typing import ConfigType

_LOGGER: Final = logging.getLogger(__name__)

CONFIG_SCHEMA: Final = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register services and the dashboard cards once per Home Assistant instance."""
    async_setup_services(hass)
    await async_register_frontend(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: WattpilotConfigEntry) -> bool:
    """Set up a charger from the config entry."""
    name = entry.data.get(CONF_FRIENDLY_NAME, entry.title)
    try:
        charger = await async_connect_new_charger(hass, entry.data)
    except AuthenticationError as err:
        raise ConfigEntryAuthFailed(
            translation_domain=DOMAIN,
            translation_key="invalid_auth",
            translation_placeholders={"name": name},
        ) from err
    except Exception as err:
        raise ConfigEntryNotReady(
            translation_domain=DOMAIN,
            translation_key="entry_cannot_connect",
            translation_placeholders={
                "name": name,
                "serial": str(entry.unique_id),
                "error": str(err) or type(err).__name__,
            },
        ) from err

    _async_migrate_unique_id(hass, entry, getattr(charger, "serial", None))

    coordinator = WattpilotCoordinator(hass, charger, entry)
    try:
        await coordinator.async_config_entry_first_refresh()
    except ConfigEntryNotReady:
        await async_DisconnectCharger(entry.entry_id, charger)
        raise

    entry.runtime_data = WattpilotRuntimeData(
        charger=charger,
        coordinator=coordinator,
        params=dict(entry.data),
    )

    async def _on_property_change(identifier: str, value: Any) -> None:
        await async_property_update_handler(hass, entry, identifier, value)

    entry.async_on_unload(charger.on_property_change(_on_property_change))

    try:
        await hass.config_entries.async_forward_entry_setups(entry, SUPPORTED_PLATFORMS)
    except BaseException:
        await async_DisconnectCharger(entry.entry_id, charger)
        raise
    return True


@callback
def _async_migrate_unique_id(
    hass: HomeAssistant, entry: WattpilotConfigEntry, serial: str | None
) -> None:
    """Key entries created before 2026.10.2 (IP address or name) by the serial."""
    if not serial or entry.unique_id == serial:
        return
    if hass.config_entries.async_entry_for_domain_unique_id(DOMAIN, serial):
        _LOGGER.warning(
            "%s: another entry already manages charger %s", entry.title, serial
        )
        return
    hass.config_entries.async_update_entry(entry, unique_id=serial)


async def async_unload_entry(hass: HomeAssistant, entry: WattpilotConfigEntry) -> bool:
    """Unload a config entry and close the charger connection."""
    unload_ok = await hass.config_entries.async_unload_platforms(
        entry, SUPPORTED_PLATFORMS
    )
    if unload_ok:
        await async_DisconnectCharger(entry.entry_id, entry.runtime_data.charger)
    return unload_ok
