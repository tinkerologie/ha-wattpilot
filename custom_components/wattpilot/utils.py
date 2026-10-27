"""Helper functions for Fronius Wattpilot."""

from __future__ import annotations

import logging
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Final

from homeassistant.const import (
    CONF_FRIENDLY_NAME,
    CONF_IP_ADDRESS,
    CONF_PASSWORD,
    CONF_TIMEOUT,
)
from wattpilot_api import Wattpilot

from .const import (
    CONF_CLOUD,
    CONF_CONNECTION,
    CONF_LOCAL,
    CONF_SERIAL,
    DEFAULT_NAME,
    DEFAULT_TIMEOUT,
    DOMAIN,
    EVENT_PROPS,
    EVENT_PROPS_ID,
)

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

_LOGGER: Final = logging.getLogger(__name__)


async def async_property_update_handler(
    hass: HomeAssistant, entry: ConfigEntry, identifier: str, value: Any
) -> None:
    """Async callback for charger property updates, dispatches to entities."""
    await _async_handle_property_update(hass, entry, identifier, value)


async def _async_handle_property_update(
    hass: HomeAssistant, entry: ConfigEntry, identifier: str, value: Any
) -> None:
    """Async: handle charger property updates."""
    try:
        entry_id = getattr(entry, "entry_id", DOMAIN)
        runtime_data = getattr(entry, "runtime_data", None)
        if runtime_data is None:
            _LOGGER.error(
                "%s - _async_handle_property_update: runtime_data missing for entry",
                entry_id,
            )
            return

        # Notify coordinator of property update
        coordinator = getattr(runtime_data, "coordinator", None)
        if coordinator is not None:
            coordinator.async_handle_property_update(identifier, value)

        entity = runtime_data.push_entities.get(identifier)
        if isinstance(entity, list):
            for ent in entity:
                hass.async_create_task(ent.async_local_push(value))
        elif entity is not None:
            hass.async_create_task(entity.async_local_push(value))

        if identifier in EVENT_PROPS:
            params = runtime_data.params or {}
            charger_id = str(
                params.get(
                    CONF_FRIENDLY_NAME, params.get(CONF_IP_ADDRESS, DEFAULT_NAME)
                )
            )
            data = {
                "charger_id": charger_id,
                "entry_id": entry_id,
                "property": identifier,
                "value": value,
            }
            hass.bus.fire(EVENT_PROPS_ID, data)
    except Exception:
        _LOGGER.exception(
            "%s - _async_handle_property_update: Could not execute async",
            entry_id,
        )


def register_push_entity(
    push_entities: dict[str, Any], identifier: str, entity: Any
) -> None:
    """Register an entity to receive property push updates without overwriting existing entities."""
    if identifier in push_entities:
        existing = push_entities[identifier]
        if isinstance(existing, list):
            existing.append(entity)
        else:
            push_entities[identifier] = [existing, entity]
    else:
        push_entities[identifier] = entity


async def async_GetChargerProp(
    charger: Any, identifier: str, default: Any | None = None
) -> Any:
    """Async: return the value of a charger attribute."""
    try:
        if not hasattr(charger, "all_properties"):
            _LOGGER.error(
                "%s - async_GetChargerProp: missing all_properties: %s", DOMAIN, charger
            )
            return default
        if identifier is None or identifier not in charger.all_properties:
            _LOGGER.debug(
                "%s - async_GetChargerProp: Charger does not have property: %s",
                DOMAIN,
                identifier,
            )
            return default
        if charger.all_properties[identifier] is None and default is not None:
            return default
        return charger.all_properties[identifier]
    except Exception:
        _LOGGER.exception("%s - async_GetChargerProp: Could not get property", DOMAIN)
        return default


def GetChargerProp(
    charger: Any, identifier: str | None = None, default: Any | None = None
) -> Any:
    """Return the value of a charger attribute."""
    try:
        if not hasattr(charger, "all_properties"):
            _LOGGER.error(
                "%s - GetChargerProp: missing all_properties: %s", DOMAIN, charger
            )
            return default
        if identifier is None or identifier not in charger.all_properties:
            _LOGGER.debug(
                "%s - GetChargerProp: Charger does not have property: %s",
                DOMAIN,
                identifier,
            )
            return default
        if charger.all_properties[identifier] is None and default is not None:
            return default
        return charger.all_properties[identifier]
    except Exception:
        _LOGGER.exception("%s - GetChargerProp: Could not get property", DOMAIN)
        return default


def has_charger_prop(charger: Any, identifier: str | None = None) -> bool:
    """Return True if identifier is present in charger.all_properties mapping."""
    if identifier is None:
        return False
    all_props = getattr(charger, "all_properties", None)
    if not isinstance(all_props, Mapping):
        return False
    return identifier in all_props


async def async_PrepareChargerApiDefinition(hass: HomeAssistant, charger: Any) -> None:
    """
    Async: load the charger's API definition cache in the executor.

    wattpilot-api reads and parses its bundled wattpilot.yaml lazily on the first
    set_property call. Doing that on the event loop trips Home Assistant's
    blocking-call detection, so warm the per-client cache here instead.
    """
    get_api_def = getattr(charger, "_get_api_def", None)
    if not callable(get_api_def):
        _LOGGER.debug(
            "%s - async_PrepareChargerApiDefinition: client has no API definition loader",
            DOMAIN,
        )
        return
    if getattr(charger, "_api_def_cache", None) is not None:
        return
    try:
        await hass.async_add_executor_job(get_api_def)
    except Exception as err:  # best effort: writes fall back to the lazy load
        _LOGGER.warning(
            "%s - async_PrepareChargerApiDefinition: could not preload API definition for %s: %s",
            DOMAIN,
            getattr(charger, "serial", "unknown"),
            err,
        )


def build_charger(data: Mapping[str, Any]) -> Wattpilot:
    """Create a Wattpilot client for a local or cloud connection."""
    connection = data.get(CONF_CONNECTION, CONF_LOCAL)
    if connection == CONF_LOCAL:
        host = data.get(CONF_IP_ADDRESS)
        cloud = False
    elif connection == CONF_CLOUD:
        host = data.get(CONF_SERIAL)
        cloud = True
    else:
        msg = f"Unknown connection type: {connection}"
        raise ValueError(msg)
    timeout = float(data.get(CONF_TIMEOUT) or DEFAULT_TIMEOUT)
    return Wattpilot(
        host=str(host),
        password=str(data.get(CONF_PASSWORD) or ""),
        serial=host,
        cloud=cloud,
        connect_timeout=timeout,
        init_timeout=timeout,
    )


async def async_connect_new_charger(
    hass: HomeAssistant, data: Mapping[str, Any]
) -> Wattpilot:
    """
    Create, prepare and connect a charger client.

    Unlike async_ConnectCharger this raises the library's errors, so callers can
    tell authentication failures from connection problems.
    """
    charger = build_charger(data)
    await async_PrepareChargerApiDefinition(hass, charger)
    await charger.connect()
    return charger


async def async_ConnectCharger(
    hass: HomeAssistant,
    entry_or_device_id: str,
    data: dict[str, Any],
    charger: Any | None = None,
) -> Any | bool:
    """
    Async: connect a new or existing charger and handle connection errors.

    The client's API definition is loaded in the executor before connecting so
    later property writes never do file I/O on the event loop. Returns the
    charger on success and False on any failure.
    """
    try:
        if charger is None:
            charger = build_charger(data)
        _LOGGER.debug(
            "%s - async_ConnectCharger: connecting charger %s",
            entry_or_device_id,
            getattr(charger, "name", None),
        )
        await async_PrepareChargerApiDefinition(hass, charger)
        await charger.connect()
    except Exception:
        _LOGGER.exception(
            "%s - async_ConnectCharger: Connecting charger failed", entry_or_device_id
        )
        return False
    return charger


async def async_DisconnectCharger(entry_or_device_id: str, charger: Any) -> None:
    """Async: disconnect charger and handle connection errors."""
    try:
        _LOGGER.debug(
            "%s - async_DisconnectCharger: disconnect charger: %s",
            entry_or_device_id,
            charger,
        )
        await charger.disconnect()
    except Exception:
        _LOGGER.exception(
            "%s - async_DisconnectCharger: Disconnect charger failed",
            entry_or_device_id,
        )
