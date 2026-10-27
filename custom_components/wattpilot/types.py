"""Type definitions for the Fronius Wattpilot integration."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from homeassistant.config_entries import ConfigEntry
from wattpilot_api import Wattpilot

if TYPE_CHECKING:
    from .coordinator import WattpilotCoordinator
    from .entities import ChargerPlatformEntity


@dataclass
class WattpilotRuntimeData:
    """Runtime data for the Wattpilot integration."""

    charger: Wattpilot  # Wattpilot client instance
    coordinator: WattpilotCoordinator  # DataUpdateCoordinator for the charger
    push_entities: dict[str, ChargerPlatformEntity | list[ChargerPlatformEntity]] = (
        field(default_factory=dict)
    )
    params: dict[str, Any] = field(default_factory=dict)


type WattpilotConfigEntry = ConfigEntry[WattpilotRuntimeData]
