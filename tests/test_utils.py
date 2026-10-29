"""Tests for utility functions."""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, MagicMock, PropertyMock, patch

import pytest
from homeassistant.const import CONF_IP_ADDRESS, CONF_PASSWORD
from homeassistant.core import HomeAssistant

from custom_components.wattpilot.const import (
    CONF_CLOUD,
    CONF_CONNECTION,
    CONF_LOCAL,
    CONF_SERIAL,
)
from custom_components.wattpilot.utils import (
    GetChargerProp,
    async_connect_new_charger,
    async_ConnectCharger,
    async_DisconnectCharger,
    async_GetChargerProp,
    async_property_update_handler,
    build_charger,
    has_charger_prop,
    register_push_entity,
)


class TestPropertyUpdateHandler:
    """Test async_property_update_handler function."""

    @pytest.mark.asyncio
    async def test_property_update_handler_success(
        self, mock_hass: HomeAssistant, mock_config_entry: Any
    ) -> None:
        """Test property update handler with valid entry."""
        # Already setup via fixture
        await async_property_update_handler(
            mock_hass, mock_config_entry, "test_prop", "test_value"
        )
        mock_config_entry.runtime_data.coordinator.async_handle_property_update.assert_called_once_with(
            "test_prop", "test_value"
        )

    @pytest.mark.asyncio
    async def test_property_update_handler_with_entity(
        self, mock_hass: HomeAssistant, mock_config_entry: Any
    ) -> None:
        """Test property update handler dispatches to entity."""
        entity = MagicMock()
        entity.async_local_push = AsyncMock()

        # Add entity to push_entities
        mock_config_entry.runtime_data.push_entities["test_prop"] = entity

        mock_hass.async_create_task = MagicMock(side_effect=lambda coro: coro.close())

        await async_property_update_handler(
            mock_hass, mock_config_entry, "test_prop", "test_value"
        )
        assert mock_hass.async_create_task.call_count == 1

    @pytest.mark.asyncio
    async def test_property_update_handler_with_entity_list(
        self, mock_hass: HomeAssistant, mock_config_entry: Any
    ) -> None:
        """Test property update handler dispatches to multiple entities in a list."""
        entity1 = MagicMock()
        entity1.async_local_push = AsyncMock()
        entity2 = MagicMock()
        entity2.async_local_push = AsyncMock()

        mock_config_entry.runtime_data.push_entities["test_prop"] = [entity1, entity2]
        mock_hass.async_create_task = MagicMock(side_effect=lambda coro: coro.close())

        await async_property_update_handler(
            mock_hass, mock_config_entry, "test_prop", "test_value"
        )
        assert mock_hass.async_create_task.call_count == 2

    @pytest.mark.asyncio
    async def test_property_update_handler_fires_event(
        self, mock_hass: HomeAssistant, mock_config_entry: Any
    ) -> None:
        """Test property update handler fires event for EVENT_PROPS."""
        # Update params via fixture
        mock_config_entry.runtime_data.params["friendly_name"] = "Test Charger"

        with patch("custom_components.wattpilot.utils.EVENT_PROPS", ["test_prop"]):
            await async_property_update_handler(
                mock_hass, mock_config_entry, "test_prop", "test_value"
            )
            mock_hass.bus.fire.assert_called_once()

    @pytest.mark.asyncio
    async def test_property_update_handler_missing_runtime_data(
        self, mock_hass: HomeAssistant, mock_config_entry: Any
    ) -> None:
        """Test property update handler with missing runtime data."""
        mock_config_entry.runtime_data = None

        # Should log error but not raise
        await async_property_update_handler(
            mock_hass, mock_config_entry, "test_prop", "test_value"
        )

    @pytest.mark.asyncio
    async def test_property_update_handler_exception(
        self, mock_hass: HomeAssistant, mock_config_entry: Any
    ) -> None:
        """Test property update handler handles exceptions."""
        mock_config_entry.runtime_data.coordinator.async_handle_property_update = (
            MagicMock(side_effect=Exception("test error"))
        )

        # Should log exception but not raise
        await async_property_update_handler(
            mock_hass, mock_config_entry, "test_prop", "test_value"
        )


class TestRegisterPushEntity:
    """Test register_push_entity helper function."""

    def test_register_push_entity_first_entry(self) -> None:
        """Test registering the first entity for an identifier."""
        push_entities: dict[str, Any] = {}
        entity = MagicMock()
        register_push_entity(push_entities, "prop_1", entity)
        assert push_entities["prop_1"] is entity

    def test_register_push_entity_second_entry(self) -> None:
        """Test registering a second entity creates a list."""
        entity1 = MagicMock()
        entity2 = MagicMock()
        push_entities: dict[str, Any] = {"prop_1": entity1}
        register_push_entity(push_entities, "prop_1", entity2)
        assert push_entities["prop_1"] == [entity1, entity2]

    def test_register_push_entity_third_entry(self) -> None:
        """Test registering subsequent entities appends to the list."""
        entity1 = MagicMock()
        entity2 = MagicMock()
        entity3 = MagicMock()
        push_entities: dict[str, Any] = {"prop_1": [entity1, entity2]}
        register_push_entity(push_entities, "prop_1", entity3)
        assert push_entities["prop_1"] == [entity1, entity2, entity3]


class TestChargerPropertyAccess:
    """Test GetChargerProp and async_GetChargerProp functions."""

    def test_get_charger_prop_success(self, mock_charger: MagicMock) -> None:
        """Test GetChargerProp returns property value."""
        mock_charger.all_properties = {"frc": 1, "amp": 16}

        result = GetChargerProp(mock_charger, "frc")
        assert result == 1

    def test_get_charger_prop_with_default(self, mock_charger: MagicMock) -> None:
        """Test GetChargerProp returns default for missing property."""
        mock_charger.all_properties = {}

        result = GetChargerProp(mock_charger, "missing_prop", "default")
        assert result == "default"

    def test_get_charger_prop_none_value_uses_default(
        self, mock_charger: MagicMock
    ) -> None:
        """Test GetChargerProp returns default when property is None."""
        mock_charger.all_properties = {"test": None}

        result = GetChargerProp(mock_charger, "test", "fallback")
        assert result == "fallback"

    def test_get_charger_prop_missing_all_properties(self) -> None:
        """Test GetChargerProp with charger missing all_properties."""
        charger = MagicMock(spec=[])

        result = GetChargerProp(charger, "test", "default")
        assert result == "default"

    def test_get_charger_prop_none_identifier(self, mock_charger: MagicMock) -> None:
        """Test GetChargerProp with None identifier."""
        result = GetChargerProp(mock_charger, None, "default")
        assert result == "default"

    def test_get_charger_prop_exception(self, mock_charger: MagicMock) -> None:
        """Test GetChargerProp handles exceptions."""
        from unittest.mock import PropertyMock

        type(mock_charger).all_properties = PropertyMock(side_effect=Exception("test"))

        result = GetChargerProp(mock_charger, "test", "default")
        assert result == "default"

    def test_has_charger_prop_success(self, mock_charger: MagicMock) -> None:
        """Test has_charger_prop returns True when property exists."""
        mock_charger.all_properties = {"frc": 1, "trx": None}
        assert has_charger_prop(mock_charger, "frc") is True
        assert has_charger_prop(mock_charger, "trx") is True
        assert has_charger_prop(mock_charger, "missing") is False

    def test_has_charger_prop_edge_cases(self) -> None:
        """Test has_charger_prop with None identifier or missing/invalid all_properties."""
        charger = MagicMock()
        charger.all_properties = None
        assert has_charger_prop(charger, "frc") is False
        assert has_charger_prop(charger, None) is False

        charger.all_properties = "not_a_mapping"
        assert has_charger_prop(charger, "frc") is False

        del charger.all_properties
        assert has_charger_prop(charger, "frc") is False

    @pytest.mark.asyncio
    async def test_async_get_charger_prop_success(
        self, mock_charger: MagicMock
    ) -> None:
        """Test async_GetChargerProp returns property value."""
        mock_charger.all_properties = {"frc": 1, "amp": 16}

        result = await async_GetChargerProp(mock_charger, "frc")
        assert result == 1

    @pytest.mark.asyncio
    async def test_async_get_charger_prop_with_default(
        self, mock_charger: MagicMock
    ) -> None:
        """Test async_GetChargerProp returns default for missing property."""
        mock_charger.all_properties = {}

        result = await async_GetChargerProp(mock_charger, "missing", "default")
        assert result == "default"

    @pytest.mark.asyncio
    async def test_async_get_charger_prop_none_value_uses_default(
        self, mock_charger: MagicMock
    ) -> None:
        """Test async_GetChargerProp returns default when property is None."""
        mock_charger.all_properties = {"test": None}

        result = await async_GetChargerProp(mock_charger, "test", "fallback")
        assert result == "fallback"

    @pytest.mark.asyncio
    async def test_async_get_charger_prop_missing_all_properties(self) -> None:
        """Test async_GetChargerProp with charger missing all_properties."""
        charger = MagicMock(spec=[])

        result = await async_GetChargerProp(charger, "test", "default")
        assert result == "default"

    @pytest.mark.asyncio
    async def test_async_get_charger_prop_none_identifier(
        self, mock_charger: MagicMock
    ) -> None:
        """Test async_GetChargerProp with None identifier."""
        result = await async_GetChargerProp(mock_charger, None, "default")
        assert result == "default"

    @pytest.mark.asyncio
    async def test_async_get_charger_prop_exception(
        self, mock_charger: MagicMock
    ) -> None:
        """Test async_GetChargerProp handles exceptions."""
        mock_charger.all_properties = AsyncMock(side_effect=Exception("test"))

        result = await async_GetChargerProp(mock_charger, "test", "default")
        assert result == "default"


class TestChargerConnection:
    """Test charger connection functions."""

    @pytest.mark.asyncio
    async def test_connect_charger_local_success(self, mock_hass: MagicMock) -> None:
        """Test async_ConnectCharger for local connection."""
        data = {
            CONF_CONNECTION: CONF_LOCAL,
            CONF_IP_ADDRESS: "192.168.1.100",
            CONF_PASSWORD: "test_pass",
        }

        mock_charger = MagicMock()
        mock_charger.connect = AsyncMock()
        mock_charger.name = "Test Charger"

        with patch(
            "custom_components.wattpilot.utils.Wattpilot"
        ) as mock_wattpilot_class:
            mock_wattpilot_class.return_value = mock_charger

            result = await async_ConnectCharger(mock_hass, "test_entry", data)

            assert result == mock_charger
            mock_wattpilot_class.assert_called_once_with(
                host="192.168.1.100",
                password="test_pass",
                serial="192.168.1.100",
                cloud=False,
                connect_timeout=15.0,
                init_timeout=15.0,
            )
            mock_charger.connect.assert_called_once()

    @pytest.mark.asyncio
    async def test_connect_charger_cloud_success(self, mock_hass: MagicMock) -> None:
        """Test async_ConnectCharger for cloud connection."""
        data = {
            CONF_CONNECTION: CONF_CLOUD,
            CONF_SERIAL: "12345678",
            CONF_PASSWORD: "test_pass",
        }

        mock_charger = MagicMock()
        mock_charger.connect = AsyncMock()
        mock_charger.name = "Test Charger"

        with patch(
            "custom_components.wattpilot.utils.Wattpilot"
        ) as mock_wattpilot_class:
            mock_wattpilot_class.return_value = mock_charger

            result = await async_ConnectCharger(mock_hass, "test_entry", data)

            assert result == mock_charger
            mock_wattpilot_class.assert_called_once_with(
                host="12345678",
                password="test_pass",
                serial="12345678",
                cloud=True,
                connect_timeout=15.0,
                init_timeout=15.0,
            )
            mock_charger.connect.assert_called_once()

    @pytest.mark.asyncio
    async def test_connect_charger_reconnect_existing(
        self, mock_hass: MagicMock
    ) -> None:
        """Test async_ConnectCharger with existing charger (reconnect)."""
        data = {CONF_CONNECTION: CONF_LOCAL, CONF_IP_ADDRESS: "192.168.1.100"}

        existing_charger = MagicMock()
        existing_charger.connect = AsyncMock()
        existing_charger.name = "Existing Charger"

        result = await async_ConnectCharger(
            mock_hass, "test_entry", data, existing_charger
        )

        assert result == existing_charger
        existing_charger.connect.assert_called_once()

    @pytest.mark.asyncio
    async def test_connect_charger_unknown_connection_type(
        self, mock_hass: MagicMock
    ) -> None:
        """Test async_ConnectCharger with unknown connection type."""
        data = {CONF_CONNECTION: "invalid"}

        result = await async_ConnectCharger(mock_hass, "test_entry", data)
        assert result is False

    @pytest.mark.asyncio
    async def test_connect_charger_exception(self, mock_hass: MagicMock) -> None:
        """Test async_ConnectCharger handles exceptions."""
        data = {
            CONF_CONNECTION: CONF_LOCAL,
            CONF_IP_ADDRESS: "192.168.1.100",
            CONF_PASSWORD: "test_pass",
        }

        with patch(
            "custom_components.wattpilot.utils.Wattpilot",
            side_effect=Exception("Connection failed"),
        ):
            result = await async_ConnectCharger(mock_hass, "test_entry", data)
            assert result is False

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        ("data", "cloud"),
        [
            ({CONF_CONNECTION: CONF_LOCAL, CONF_IP_ADDRESS: "192.168.1.100"}, False),
            ({CONF_CONNECTION: CONF_CLOUD, CONF_SERIAL: "12345678"}, True),
        ],
    )
    async def test_connect_charger_preloads_api_definition_before_connect(
        self, mock_hass: MagicMock, data: dict, cloud: bool
    ) -> None:
        """The API definition loads in the executor before the websocket connects."""
        calls: list[str] = []
        charger = MagicMock()
        charger._api_def_cache = None
        charger._get_api_def = MagicMock(side_effect=lambda: calls.append("load"))
        charger.connect = AsyncMock(side_effect=lambda: calls.append("connect"))

        with patch("custom_components.wattpilot.utils.Wattpilot") as wattpilot_cls:
            wattpilot_cls.return_value = charger
            result = await async_ConnectCharger(mock_hass, "test_entry", data)

        assert result is charger
        assert wattpilot_cls.call_args.kwargs["cloud"] is cloud
        mock_hass.async_add_executor_job.assert_awaited_once_with(charger._get_api_def)
        assert calls == ["load", "connect"]

    @pytest.mark.asyncio
    async def test_connect_charger_reused_warm_cache_skips_executor(
        self, mock_hass: MagicMock, mock_charger: MagicMock
    ) -> None:
        """A reused client with a populated cache needs no executor call."""
        mock_charger._api_def_cache = object()

        result = await async_ConnectCharger(
            mock_hass, "test_entry", {CONF_CONNECTION: CONF_LOCAL}, mock_charger
        )

        assert result is mock_charger
        mock_hass.async_add_executor_job.assert_not_called()
        mock_charger.connect.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_connect_charger_reused_cold_cache_preloads(
        self, mock_hass: MagicMock, mock_charger: MagicMock
    ) -> None:
        """A reused client with a cold cache is prepared before reconnecting."""
        result = await async_ConnectCharger(
            mock_hass, "test_entry", {CONF_CONNECTION: CONF_LOCAL}, mock_charger
        )

        assert result is mock_charger
        mock_charger._get_api_def.assert_called_once_with()
        mock_charger.connect.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_connect_charger_preload_failure_still_connects(
        self,
        mock_hass: MagicMock,
        mock_charger: MagicMock,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        """A definition load failure is logged and does not block connecting."""
        mock_charger._get_api_def.side_effect = OSError("missing yaml")

        result = await async_ConnectCharger(
            mock_hass, "test_entry", {CONF_CONNECTION: CONF_LOCAL}, mock_charger
        )

        assert result is mock_charger
        mock_charger.connect.assert_awaited_once()
        assert "could not preload API definition" in caplog.text

    @pytest.mark.asyncio
    async def test_connect_charger_without_definition_loader(
        self, mock_hass: MagicMock
    ) -> None:
        """Clients without the private loader are connected without preparation."""
        charger = MagicMock(spec=["connect", "name"])
        charger.connect = AsyncMock()

        result = await async_ConnectCharger(
            mock_hass, "test_entry", {CONF_CONNECTION: CONF_LOCAL}, charger
        )

        assert result is charger
        mock_hass.async_add_executor_job.assert_not_called()
        charger.connect.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_connect_charger_connect_failure_returns_false(
        self, mock_hass: MagicMock, mock_charger: MagicMock
    ) -> None:
        """A failing websocket connect returns False."""
        mock_charger.connect.side_effect = ConnectionError("refused")

        result = await async_ConnectCharger(
            mock_hass, "test_entry", {CONF_CONNECTION: CONF_LOCAL}, mock_charger
        )

        assert result is False

    @pytest.mark.asyncio
    async def test_connect_new_charger_raises_library_errors(
        self, mock_hass: MagicMock, mock_charger: MagicMock
    ) -> None:
        """async_connect_new_charger prepares the client and propagates errors."""
        data = {CONF_CONNECTION: CONF_LOCAL, CONF_IP_ADDRESS: "192.168.1.100"}
        with patch(
            "custom_components.wattpilot.utils.Wattpilot", return_value=mock_charger
        ):
            assert await async_connect_new_charger(mock_hass, data) is mock_charger
            mock_charger._get_api_def.assert_called_once_with()

            mock_charger.connect.side_effect = ConnectionError("refused")
            with pytest.raises(ConnectionError):
                await async_connect_new_charger(mock_hass, data)

    def test_build_charger_rejects_unknown_connection(self) -> None:
        """An unknown connection type cannot build a client."""
        with pytest.raises(ValueError, match="Unknown connection type"):
            build_charger({CONF_CONNECTION: "bluetooth"})

    @pytest.mark.asyncio
    async def test_disconnect_charger_success(self, mock_charger: MagicMock) -> None:
        """Test async_DisconnectCharger successfully disconnects."""
        await async_DisconnectCharger("test_entry", mock_charger)
        mock_charger.disconnect.assert_called_once()

    @pytest.mark.asyncio
    async def test_disconnect_charger_exception(self, mock_charger: MagicMock) -> None:
        """Test async_DisconnectCharger handles exceptions."""
        mock_charger.disconnect = AsyncMock(side_effect=Exception("Disconnect failed"))

        # Should log exception but not raise
        await async_DisconnectCharger("test_entry", mock_charger)


@pytest.mark.parametrize(
    ("identifier", "default", "expected"),
    [("car", None, 2), ("missing", "x", "x"), ("none_value", "d", "d")],
)
async def test_property_helpers_read_all_properties_once(
    identifier: str, default: Any, expected: Any
) -> None:
    """wattpilot-api copies the property dict on every read; read it once (#187)."""
    charger = MagicMock()
    reads = PropertyMock(return_value={"car": 2, "none_value": None})
    type(charger).all_properties = reads

    assert GetChargerProp(charger, identifier, default) == expected
    assert reads.call_count == 1
    reads.reset_mock()
    assert await async_GetChargerProp(charger, identifier, default) == expected
    assert reads.call_count == 1


async def test_property_helpers_handle_none_all_properties() -> None:
    """A charger whose all_properties is None returns the default."""
    charger = MagicMock(all_properties=None)

    assert GetChargerProp(charger, "car", 7) == 7
    assert await async_GetChargerProp(charger, "car", 7) == 7
