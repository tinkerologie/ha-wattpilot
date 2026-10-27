"""Fixtures for tests that need a real Home Assistant instance."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from unittest.mock import AsyncMock, patch

import pytest

# The parent conftest aliases `hass` to a MagicMock for the unit tests; re-export
# the plugin's real fixture so tests in this package get a running instance.
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.plugins import hass  # noqa: F401

from custom_components.wattpilot.const import (
    CONF_CONNECTION,
    CONF_LOCAL,
    DOMAIN,
)

if TYPE_CHECKING:
    from collections.abc import Generator
    from unittest.mock import MagicMock

ENTRY_DATA: dict[str, Any] = {
    "friendly_name": "Garage",
    "ip_address": "192.168.1.100",
    "password": "secret",
    "timeout": 15,
    CONF_CONNECTION: CONF_LOCAL,
}


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Load the integration from custom_components."""
    return


@pytest.fixture
def config_entry() -> MockConfigEntry:
    """A local-connection config entry keyed by the charger serial."""
    return MockConfigEntry(
        domain=DOMAIN, title="Garage", unique_id="12345678", data=dict(ENTRY_DATA)
    )


@pytest.fixture
def connect_charger(mock_charger: MagicMock) -> Generator[AsyncMock]:
    """Patch the connection used by setup to return the mock charger."""
    mock_charger.serial = "12345678"
    with patch(
        "custom_components.wattpilot.async_connect_new_charger",
        AsyncMock(return_value=mock_charger),
    ) as connect:
        yield connect
