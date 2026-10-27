"""Configuration schemas for Fronius Wattpilot."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Final

import probatio
from homeassistant.const import (
    CONF_FRIENDLY_NAME,
    CONF_IP_ADDRESS,
    CONF_PASSWORD,
    CONF_TIMEOUT,
)
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)

from .const import CONF_SERIAL, DEFAULT_NAME, DEFAULT_TIMEOUT

if TYPE_CHECKING:
    from collections.abc import Mapping

_PASSWORD_SELECTOR: Final = TextSelector(
    TextSelectorConfig(type=TextSelectorType.PASSWORD, autocomplete="current-password")
)
_TIMEOUT_SELECTOR: Final = NumberSelector(
    NumberSelectorConfig(
        min=5, max=120, step=1, mode=NumberSelectorMode.BOX, unit_of_measurement="s"
    )
)


def _connection_schema(
    host_key: str, defaults: Mapping[str, Any], *, password_required: bool
) -> probatio.Schema:
    schema: dict[probatio.Marker, Any] = {
        probatio.Required(
            CONF_FRIENDLY_NAME, default=defaults.get(CONF_FRIENDLY_NAME, DEFAULT_NAME)
        ): TextSelector(),
        probatio.Required(
            host_key, default=defaults.get(host_key, probatio.UNDEFINED)
        ): (TextSelector()),
    }
    password = probatio.Required if password_required else probatio.Optional
    schema[password(CONF_PASSWORD)] = _PASSWORD_SELECTOR
    schema[
        probatio.Optional(
            CONF_TIMEOUT, default=defaults.get(CONF_TIMEOUT, DEFAULT_TIMEOUT)
        )
    ] = _TIMEOUT_SELECTOR
    return probatio.Schema(schema)


def local_schema(
    defaults: Mapping[str, Any] | None = None, *, password_required: bool = True
) -> probatio.Schema:
    """Schema for a local (LAN) connection; reconfiguring may keep the password."""
    return _connection_schema(
        CONF_IP_ADDRESS, defaults or {}, password_required=password_required
    )


def cloud_schema(
    defaults: Mapping[str, Any] | None = None, *, password_required: bool = True
) -> probatio.Schema:
    """Schema for a cloud connection; reconfiguring may keep the password."""
    return _connection_schema(
        CONF_SERIAL, defaults or {}, password_required=password_required
    )


def discovery_schema(name: str) -> probatio.Schema:
    """Schema for confirming a discovered charger."""
    return probatio.Schema(
        {
            probatio.Required(CONF_FRIENDLY_NAME, default=name): TextSelector(),
            probatio.Required(CONF_PASSWORD): _PASSWORD_SELECTOR,
        }
    )


REAUTH_SCHEMA: Final = probatio.Schema(
    {probatio.Required(CONF_PASSWORD): _PASSWORD_SELECTOR}
)
