"""Helper functions for Fronius Wattpilot."""

from __future__ import annotations

import asyncio
import datetime as dt
import logging
from collections.abc import Mapping
from types import SimpleNamespace
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

_MISSING: Final = object()

SCHEDULE_CHARGER_KEYS: Final = ("sch_week", "sch_satur", "sch_sund")
_SCHEDULE_RANGE_COUNT: Final = 2
_MAX_HOUR: Final = 23
_MAX_MINUTE: Final = 59
_MAX_SECOND: Final = 59
SCHEDULE_DAY_GROUP_MAP: Final[dict[str, tuple[str, ...]]] = {
    "weekday": ("sch_week",),
    "weekdays": ("sch_week",),
    "sch_week": ("sch_week",),
    "saturday": ("sch_satur",),
    "sch_satur": ("sch_satur",),
    "sunday": ("sch_sund",),
    "sch_sund": ("sch_sund",),
    "weekend": ("sch_satur", "sch_sund"),
    "all": ("sch_week", "sch_satur", "sch_sund"),
}
SCHEDULE_CONTROL_OPTIONS: Final[dict[int, str]] = {
    0: "Disabled",
    1: "Allow Charging",
    2: "Block Charging",
    3: "Allow Charging + PV Surplus",
    4: "Block Charging + PV Surplus",
}
SCHEDULE_CONTROL_ALIASES: Final[dict[str, int]] = {
    "0": 0,
    "disabled": 0,
    "off": 0,
    "1": 1,
    "allow": 1,
    "allow charging": 1,
    "allow_charging": 1,
    "inside": 1,
    "2": 2,
    "block": 2,
    "block charging": 2,
    "block_charging": 2,
    "outside": 2,
    "3": 3,
    "allow charging + pv surplus": 3,
    "allow_charging_pv_surplus": 3,
    "allowfromgrid": 3,
    "allow_from_grid": 3,
    "4": 4,
    "block charging + pv surplus": 4,
    "block_charging_pv_surplus": 4,
    "blockfromgrid": 4,
    "block_from_grid": 4,
}


def _get_obj_field(obj: Any, key: str, default: Any = None) -> Any:
    """Read a field from a dict or SimpleNamespace-like object."""
    if isinstance(obj, Mapping):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _has_obj_field(obj: Any, key: str) -> bool:
    """Return True if a dict or object explicitly contains key."""
    if isinstance(obj, Mapping):
        return key in obj
    return hasattr(obj, key)


def _parse_edge_time(edge_obj: Any) -> tuple[dt.time, bool] | None:
    """Parse a schedule range edge ({hour, minute[, second]}) into (dt.time, has_seconds)."""
    if isinstance(edge_obj, dt.time):
        return edge_obj, edge_obj.second != 0
    if not isinstance(edge_obj, (Mapping, SimpleNamespace)) and not (
        hasattr(edge_obj, "hour") and hasattr(edge_obj, "minute")
    ):
        return None
    try:
        hour = int(_get_obj_field(edge_obj, "hour", 0))
        minute = int(_get_obj_field(edge_obj, "minute", 0))
        has_sec = _has_obj_field(edge_obj, "second")
        second = int(_get_obj_field(edge_obj, "second", 0)) if has_sec else 0
        if not (
            0 <= hour <= _MAX_HOUR
            and 0 <= minute <= _MAX_MINUTE
            and 0 <= second <= _MAX_SECOND
        ):
            return None
        return dt.time(hour, minute, second), has_sec
    except (TypeError, ValueError):
        return None


def extract_schedule_data(raw: Any) -> dict[str, Any] | None:
    """Normalize a raw Wattpilot schedule property (SimpleNamespace or dict) into structured data."""
    if raw is None:
        return None
    if not isinstance(raw, (Mapping, SimpleNamespace)) and not (
        hasattr(raw, "control") or hasattr(raw, "ranges")
    ):
        return None

    try:
        control = int(_get_obj_field(raw, "control", 0))
    except (TypeError, ValueError):
        control = 0

    raw_ranges = _get_obj_field(raw, "ranges", None)
    parsed_ranges: list[dict[str, dt.time]] = []
    has_seconds = False

    if isinstance(raw_ranges, (list, tuple)):
        for item in raw_ranges[:_SCHEDULE_RANGE_COUNT]:
            begin_res = _parse_edge_time(_get_obj_field(item, "begin", None))
            end_res = _parse_edge_time(_get_obj_field(item, "end", None))
            begin_time = begin_res[0] if begin_res is not None else dt.time(0, 0, 0)
            end_time = end_res[0] if end_res is not None else dt.time(0, 0, 0)
            if (begin_res and begin_res[1]) or (end_res and end_res[1]):
                has_seconds = True
            parsed_ranges.append({"begin": begin_time, "end": end_time})

    while len(parsed_ranges) < _SCHEDULE_RANGE_COUNT:
        parsed_ranges.append({"begin": dt.time(0, 0, 0), "end": dt.time(0, 0, 0)})

    return {
        "control": control,
        "ranges": parsed_ranges,
        "has_seconds": has_seconds,
    }


def extract_schedule_range_time(
    raw: Any, range_index: int, range_edge: str
) -> dt.time | None:
    """Extract a datetime.time for a specific schedule range index (0 or 1) and edge ('begin' or 'end')."""
    if raw is None or range_edge not in ("begin", "end"):
        return None
    if isinstance(raw, dt.time):
        return raw

    if isinstance(raw, (list, tuple)):
        if not (0 <= range_index < len(raw)):
            return None
        edge_obj = _get_obj_field(raw[range_index], range_edge, None)
        res = _parse_edge_time(edge_obj)
        return res[0] if res is not None else None

    schedule = extract_schedule_data(raw)
    if schedule is None:
        return None
    ranges = schedule["ranges"]
    if not (0 <= range_index < len(ranges)):
        return None
    val = ranges[range_index].get(range_edge)
    return val if isinstance(val, dt.time) else None


def format_schedule_attributes(raw: Any) -> dict[str, Any]:
    """Return JSON-serializable schedule range summary attributes for Home Assistant state machine."""
    schedule = extract_schedule_data(raw)
    if schedule is None:
        return {}
    ranges = schedule["ranges"]
    r0_begin = ranges[0]["begin"]
    r0_end = ranges[0]["end"]
    r1_begin = ranges[1]["begin"]
    r1_end = ranges[1]["end"]
    return {
        "range_1": f"{r0_begin.strftime('%H:%M')} - {r0_end.strftime('%H:%M')}",
        "range_2": f"{r1_begin.strftime('%H:%M')} - {r1_end.strftime('%H:%M')}",
        "range_1_start": r0_begin.strftime("%H:%M:%S"),
        "range_1_end": r0_end.strftime("%H:%M:%S"),
        "range_2_start": r1_begin.strftime("%H:%M:%S"),
        "range_2_end": r1_end.strftime("%H:%M:%S"),
    }


def build_schedule_payload(
    raw: Any,
    *,
    control: int | None = None,
    range_updates: Mapping[int, Mapping[str, dt.time]] | None = None,
) -> dict[str, Any]:
    """Build a JSON-serializable Wattpilot schedule object merging updates with existing schedule state."""
    schedule = extract_schedule_data(raw)
    if schedule is None:
        final_control = 0
        ranges = [
            {"begin": dt.time(0, 0, 0), "end": dt.time(0, 0, 0)},
            {"begin": dt.time(0, 0, 0), "end": dt.time(0, 0, 0)},
        ]
        has_seconds = True
    else:
        final_control = schedule["control"]
        ranges = [dict(r) for r in schedule["ranges"]]
        has_seconds = bool(schedule["has_seconds"])

    if control is not None:
        final_control = int(control)

    if range_updates:
        for idx, edge_map in range_updates.items():
            if 0 <= idx < len(ranges):
                for edge_name, time_val in edge_map.items():
                    if edge_name in ("begin", "end") and isinstance(time_val, dt.time):
                        ranges[idx][edge_name] = time_val

    def _edge_dict(t: dt.time) -> dict[str, int]:
        d: dict[str, int] = {"hour": t.hour, "minute": t.minute}
        if has_seconds or t.second != 0:
            d["second"] = t.second
        return d

    return {
        "control": final_control,
        "ranges": [
            {
                "begin": _edge_dict(r["begin"]),
                "end": _edge_dict(r["end"]),
            }
            for r in ranges
        ],
    }


def cache_charger_prop(charger: Any, identifier: str, value: Any) -> None:
    """Update the in-memory property cache on the charger after a successful write."""
    all_props = getattr(charger, "_all_props", None)
    if isinstance(all_props, dict):
        all_props[identifier] = value
    mock_props = getattr(charger, "all_properties", None)
    if isinstance(mock_props, dict):
        mock_props[identifier] = value


async def async_write_schedule_property(
    entry: Any,
    charger: Any,
    identifier: str,
    *,
    control: int | None = None,
    range_updates: Mapping[int, Mapping[str, dt.time]] | None = None,
) -> dict[str, Any]:
    """Serialize schedule read-modify-write and cache updates under one per-charger lock."""
    runtime_data = getattr(entry, "runtime_data", None)
    lock = getattr(runtime_data, "schedule_lock", None)
    if not isinstance(lock, asyncio.Lock):
        lock = asyncio.Lock()
    async with lock:
        current_raw = GetChargerProp(charger, identifier, None)
        payload = build_schedule_payload(
            current_raw,
            control=control,
            range_updates=range_updates,
        )
        await charger.set_property(identifier, payload)
        cache_charger_prop(charger, identifier, payload)
        return payload


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
        # wattpilot-api returns a fresh copy on every read, so read it once.
        all_props: Any = getattr(charger, "all_properties", _MISSING)
        if all_props is _MISSING:
            _LOGGER.error(
                "%s - async_GetChargerProp: missing all_properties: %s", DOMAIN, charger
            )
            return default
        if identifier is None or identifier not in all_props:
            _LOGGER.debug(
                "%s - async_GetChargerProp: Charger does not have property: %s",
                DOMAIN,
                identifier,
            )
            return default
        value = all_props[identifier]
        if value is None and default is not None:
            return default
        return value
    except Exception:
        _LOGGER.exception("%s - async_GetChargerProp: Could not get property", DOMAIN)
        return default


def GetChargerProp(
    charger: Any, identifier: str | None = None, default: Any | None = None
) -> Any:
    """Return the value of a charger attribute."""
    try:
        # wattpilot-api returns a fresh copy on every read, so read it once.
        all_props: Any = getattr(charger, "all_properties", _MISSING)
        if all_props is _MISSING:
            _LOGGER.error(
                "%s - GetChargerProp: missing all_properties: %s", DOMAIN, charger
            )
            return default
        if identifier is None or identifier not in all_props:
            _LOGGER.debug(
                "%s - GetChargerProp: Charger does not have property: %s",
                DOMAIN,
                identifier,
            )
            return default
        value = all_props[identifier]
        if value is None and default is not None:
            return default
        return value
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
