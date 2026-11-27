"""Services for the Fronius Wattpilot integration."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Final

import probatio
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_DEVICE_ID, CONF_TRIGGER_TIME
from homeassistant.core import (
    HomeAssistant,
    ServiceCall,
    ServiceResponse,
    SupportsResponse,
    callback,
)
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import device_registry as dr

from .const import CONF_CLOUD_API, DOMAIN
from .utils import (
    SCHEDULE_CONTROL_ALIASES,
    SCHEDULE_CONTROL_OPTIONS,
    SCHEDULE_DAY_GROUP_MAP,
    async_ConnectCharger,
    async_write_schedule_property,
)

if TYPE_CHECKING:
    import datetime as dt
    from typing import Any

    from .types import WattpilotConfigEntry

_LOGGER: Final = logging.getLogger(__name__)

SERVICE_SET_NEXT_TRIP: Final = "set_next_trip"
SERVICE_SET_GOE_CLOUD: Final = "set_goe_cloud"
SERVICE_DISCONNECT_CHARGER: Final = "disconnect_charger"
SERVICE_RECONNECT_CHARGER: Final = "reconnect_charger"
SERVICE_SET_CHARGING_SCHEDULE: Final = "set_charging_schedule"

_DEVICE_SCHEMA: Final = probatio.Schema({probatio.Required(CONF_DEVICE_ID): cv.string})
_NEXT_TRIP_SCHEMA: Final = _DEVICE_SCHEMA.extend(
    {probatio.Required(CONF_TRIGGER_TIME): cv.time}
)
_GOE_CLOUD_SCHEMA: Final = _DEVICE_SCHEMA.extend(
    {probatio.Required(CONF_CLOUD_API): cv.boolean}
)
_CHARGING_SCHEDULE_SCHEMA: Final = _DEVICE_SCHEMA.extend(
    {
        probatio.Optional("schedule", default="all"): probatio.In(
            list(SCHEDULE_DAY_GROUP_MAP.keys())
        ),
        probatio.Optional("control"): probatio.Any(int, cv.string),
        probatio.Optional("start_time_1"): cv.time,
        probatio.Optional("end_time_1"): cv.time,
        probatio.Optional("start_time_2"): cv.time,
        probatio.Optional("end_time_2"): cv.time,
    }
)


@callback
def async_get_entry_for_device(
    hass: HomeAssistant, device_id: str
) -> WattpilotConfigEntry:
    """Return the loaded Wattpilot config entry that owns a device."""
    device = dr.async_get(hass).async_get(device_id)
    if device is None:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="device_not_found",
            translation_placeholders={"device_id": device_id},
        )
    entry = hass.config_entries.async_get_entry(device.config_entry_id)
    if entry is None or entry.domain != DOMAIN:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="device_not_wattpilot",
            translation_placeholders={
                "device": device.name_by_user or device.name or device_id
            },
        )
    if entry.state is not ConfigEntryState.LOADED:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="entry_not_loaded",
            translation_placeholders={"entry": entry.title},
        )
    return entry


def _service_failed(service: str, err: Exception) -> HomeAssistantError:
    return HomeAssistantError(
        translation_domain=DOMAIN,
        translation_key="service_failed",
        translation_placeholders={"service": service, "error": str(err)},
    )


async def _async_set_next_trip(call: ServiceCall) -> None:
    """Set the next trip departure time."""
    entry = async_get_entry_for_device(call.hass, call.data[CONF_DEVICE_ID])
    try:
        await entry.runtime_data.charger.set_next_trip(call.data[CONF_TRIGGER_TIME])
    except Exception as err:
        raise _service_failed(SERVICE_SET_NEXT_TRIP, err) from err


async def _async_set_goe_cloud(call: ServiceCall) -> ServiceResponse:
    """Enable or disable the go-e cloud API."""
    entry = async_get_entry_for_device(call.hass, call.data[CONF_DEVICE_ID])
    charger = entry.runtime_data.charger
    try:
        if not call.data[CONF_CLOUD_API]:
            await charger.disable_cloud_api()
            _LOGGER.info("%s: go-e cloud API disabled", entry.title)
            return {"enabled": False}
        cloud_info = await charger.enable_cloud_api()
    except Exception as err:
        raise _service_failed(SERVICE_SET_GOE_CLOUD, err) from err
    _LOGGER.info("%s: go-e cloud API enabled (url: %s)", entry.title, cloud_info.url)
    return {"enabled": True, "api_key": cloud_info.api_key, "url": cloud_info.url}


async def _async_disconnect_charger(call: ServiceCall) -> None:
    """Disconnect from the charger."""
    entry = async_get_entry_for_device(call.hass, call.data[CONF_DEVICE_ID])
    try:
        await entry.runtime_data.charger.disconnect()
    except Exception as err:
        raise _service_failed(SERVICE_DISCONNECT_CHARGER, err) from err
    _LOGGER.info("%s: charger disconnected", entry.title)


async def _async_reconnect_charger(call: ServiceCall) -> None:
    """Reconnect to the charger."""
    entry = async_get_entry_for_device(call.hass, call.data[CONF_DEVICE_ID])
    charger = entry.runtime_data.charger
    try:
        if charger.connected:
            await charger.disconnect()
            await asyncio.sleep(1)
    except Exception as err:
        raise _service_failed(SERVICE_RECONNECT_CHARGER, err) from err
    if not await async_ConnectCharger(
        call.hass, entry.entry_id, dict(entry.data), charger
    ):
        raise HomeAssistantError(
            translation_domain=DOMAIN,
            translation_key="reconnect_failed",
            translation_placeholders={"entry": entry.title},
        )
    _LOGGER.info("%s: charger reconnected", entry.title)


def _resolve_control_option(raw_control: Any) -> int:
    """Resolve a control option integer or string into a valid Wattpilot schedule control enum (0..4)."""
    if isinstance(raw_control, bool):
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="invalid_option",
            translation_placeholders={"option": str(raw_control)},
        )
    if isinstance(raw_control, int) and raw_control in SCHEDULE_CONTROL_OPTIONS:
        return raw_control
    if isinstance(raw_control, str):
        norm = raw_control.strip().lower()
        if norm in SCHEDULE_CONTROL_ALIASES:
            return SCHEDULE_CONTROL_ALIASES[norm]
    raise ServiceValidationError(
        translation_domain=DOMAIN,
        translation_key="invalid_option",
        translation_placeholders={"option": str(raw_control)},
    )


async def _async_set_charging_schedule(call: ServiceCall) -> None:
    """Update the built-in Wattpilot charging timer schedule."""
    entry = async_get_entry_for_device(call.hass, call.data[CONF_DEVICE_ID])
    charger = entry.runtime_data.charger
    target_keys = SCHEDULE_DAY_GROUP_MAP[str(call.data.get("schedule", "all")).lower()]

    control_val: int | None = None
    if "control" in call.data and call.data["control"] is not None:
        control_val = _resolve_control_option(call.data["control"])

    range_updates: dict[int, dict[str, dt.time]] = {}
    time_fields = (
        ("start_time_1", 0, "begin"),
        ("end_time_1", 0, "end"),
        ("start_time_2", 1, "begin"),
        ("end_time_2", 1, "end"),
    )
    for field_name, range_idx, edge_name in time_fields:
        if field_name in call.data and call.data[field_name] is not None:
            range_updates.setdefault(range_idx, {})[edge_name] = call.data[field_name]

    if control_val is None and not range_updates:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="invalid_option",
            translation_placeholders={"option": "empty schedule update"},
        )

    try:
        for prop_key in target_keys:
            await async_write_schedule_property(
                entry,
                charger,
                prop_key,
                control=control_val,
                range_updates=range_updates,
            )
    except Exception as err:
        raise _service_failed(SERVICE_SET_CHARGING_SCHEDULE, err) from err


@callback
def async_setup_services(hass: HomeAssistant) -> None:
    """Register the integration's services."""
    hass.services.async_register(
        DOMAIN, SERVICE_SET_NEXT_TRIP, _async_set_next_trip, schema=_NEXT_TRIP_SCHEMA
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_CHARGING_SCHEDULE,
        _async_set_charging_schedule,
        schema=_CHARGING_SCHEDULE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_GOE_CLOUD,
        _async_set_goe_cloud,
        schema=_GOE_CLOUD_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_DISCONNECT_CHARGER,
        _async_disconnect_charger,
        schema=_DEVICE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_RECONNECT_CHARGER,
        _async_reconnect_charger,
        schema=_DEVICE_SCHEMA,
    )
