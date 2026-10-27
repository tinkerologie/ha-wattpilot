"""Entity writes reach the charger and surface failures as translated errors."""

from __future__ import annotations

import datetime as dt
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError

from custom_components.wattpilot.button import ChargerButton
from custom_components.wattpilot.descriptions import (
    WattpilotButtonEntityDescription,
    WattpilotNumberEntityDescription,
    WattpilotSelectEntityDescription,
    WattpilotSwitchEntityDescription,
    WattpilotTimeEntityDescription,
)
from custom_components.wattpilot.number import ChargerNumber
from custom_components.wattpilot.select import ChargerSelect
from custom_components.wattpilot.switch import ChargerSwitch
from custom_components.wattpilot.time import ChargerTime


@pytest.fixture
def charger(mock_charger: MagicMock) -> MagicMock:
    """Charger whose writes can be inspected or made to fail."""
    mock_charger.all_properties = {
        **mock_charger.all_properties,
        "frc": 0,
        "amp": 16,
        "fte": 18000,
        "lmo": 4,
        "fup": False,
        "ftt": 21600,
    }
    mock_charger.set_property = AsyncMock()
    mock_charger.set_next_trip = AsyncMock()
    mock_charger.set_next_trip_energy = AsyncMock()
    return mock_charger


def _button(hass: Any, entry: Any, charger: MagicMock) -> ChargerButton:
    desc = WattpilotButtonEntityDescription(
        key="stop", charger_key="frc", translation_key="stop_charging", set_value=1
    )
    return ChargerButton(hass, entry, desc, charger)


def _number(
    hass: Any, entry: Any, charger: MagicMock, key: str = "amp", **kwargs: Any
) -> ChargerNumber:
    desc = WattpilotNumberEntityDescription(
        key=key, charger_key=key, translation_key=key, **kwargs
    )
    return ChargerNumber(hass, entry, desc, charger)


def _select(hass: Any, entry: Any, charger: MagicMock) -> ChargerSelect:
    desc = WattpilotSelectEntityDescription(
        key="charging_mode",
        charger_key="lmo",
        translation_key="charging_mode",
        select_options={3: "Default", 4: "Eco", 5: "Next Trip"},
    )
    return ChargerSelect(hass, entry, desc, charger)


def _switch(
    hass: Any, entry: Any, charger: MagicMock, *, invert: bool = False
) -> ChargerSwitch:
    desc = WattpilotSwitchEntityDescription(
        key="pv_surplus", charger_key="fup", translation_key="pv_surplus", invert=invert
    )
    return ChargerSwitch(hass, entry, desc, charger)


def _time(hass: Any, entry: Any, charger: MagicMock) -> ChargerTime:
    desc = WattpilotTimeEntityDescription(
        key="next_trip_time", charger_key="ftt", translation_key="next_trip_time"
    )
    return ChargerTime(hass, entry, desc, charger)


async def test_writes_reach_the_charger(
    mock_hass: MagicMock, mock_config_entry: Any, charger: MagicMock
) -> None:
    """Every platform writes the expected value."""
    await _button(mock_hass, mock_config_entry, charger).async_press()
    await _number(mock_hass, mock_config_entry, charger).async_set_native_value(10)
    await _number(
        mock_hass, mock_config_entry, charger, scale_factor=0.5, set_type="int"
    ).async_set_native_value(10.4)
    await _select(mock_hass, mock_config_entry, charger).async_select_option(
        "Next Trip"
    )
    await _switch(mock_hass, mock_config_entry, charger).async_turn_on()
    await _switch(mock_hass, mock_config_entry, charger, invert=True).async_turn_off()

    assert [call.args for call in charger.set_property.await_args_list] == [
        ("frc", 1),
        ("amp", 10),
        ("amp", 21),
        ("lmo", 5),
        ("fup", True),
        ("fup", True),
    ]

    await _number(
        mock_hass, mock_config_entry, charger, key="fte"
    ).async_set_native_value(20000)
    charger.set_next_trip_energy.assert_awaited_once_with(20000)
    await _time(mock_hass, mock_config_entry, charger).async_set_value(dt.time(7, 30))
    charger.set_next_trip.assert_awaited_once_with(dt.time(7, 30))


@pytest.mark.parametrize(
    "write",
    [
        lambda h, e, c: _button(h, e, c).async_press(),
        lambda h, e, c: _number(h, e, c).async_set_native_value(10),
        lambda h, e, c: _select(h, e, c).async_select_option("Eco"),
        lambda h, e, c: _switch(h, e, c).async_turn_on(),
        lambda h, e, c: _switch(h, e, c).async_turn_off(),
    ],
)
async def test_failed_write_raises(
    mock_hass: MagicMock, mock_config_entry: Any, charger: MagicMock, write: Any
) -> None:
    """A rejected write is reported instead of silently ignored."""
    charger.set_property.side_effect = ConnectionError("socket closed")

    with pytest.raises(HomeAssistantError) as err:
        await write(mock_hass, mock_config_entry, charger)

    assert err.value.translation_key == "write_failed"
    assert err.value.translation_placeholders["error"] == "socket closed"


async def test_failed_time_write_raises(
    mock_hass: MagicMock, mock_config_entry: Any, charger: MagicMock
) -> None:
    """A rejected next trip time is reported."""
    charger.set_next_trip.side_effect = ValueError()

    with pytest.raises(HomeAssistantError) as err:
        await _time(mock_hass, mock_config_entry, charger).async_set_value(dt.time(7))

    assert err.value.translation_placeholders["error"] == "ValueError"


async def test_select_rejects_unknown_option(
    mock_hass: MagicMock, mock_config_entry: Any, charger: MagicMock
) -> None:
    """An option without a charger value is a validation error."""
    with pytest.raises(ServiceValidationError) as err:
        await _select(mock_hass, mock_config_entry, charger).async_select_option(
            "Turbo"
        )

    assert err.value.translation_key == "invalid_option"
    charger.set_property.assert_not_awaited()
