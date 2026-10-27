"""Tests for the integration setup."""

from __future__ import annotations

from unittest.mock import MagicMock


class TestIntegrationSetup:
    """Test integration setup."""

    def test_domain_is_wattpilot(self) -> None:
        """Test the domain constant."""
        from custom_components.wattpilot.const import DOMAIN

        assert DOMAIN == "wattpilot"

    def test_supported_platforms(self) -> None:
        """Test supported platforms are defined."""
        from custom_components.wattpilot.const import SUPPORTED_PLATFORMS

        expected_platforms = [
            "binary_sensor",
            "button",
            "number",
            "select",
            "sensor",
            "switch",
            "time",
            "update",
        ]
        assert sorted(SUPPORTED_PLATFORMS) == sorted(expected_platforms)

    def test_runtime_data_structure(self) -> None:
        """Test runtime data structure."""
        from custom_components.wattpilot.types import WattpilotRuntimeData

        charger = MagicMock()
        coordinator = MagicMock()
        runtime_data = WattpilotRuntimeData(
            charger=charger,
            coordinator=coordinator,
            push_entities={},
            params={"test": "value"},
        )

        assert runtime_data.charger == charger
        assert runtime_data.coordinator == coordinator
        assert runtime_data.push_entities == {}
        assert runtime_data.params == {"test": "value"}


class TestConstants:
    """Test constant values."""

    def test_default_timeout(self) -> None:
        """Test default timeout value."""
        from custom_components.wattpilot.const import DEFAULT_TIMEOUT

        assert DEFAULT_TIMEOUT == 15

    def test_cloud_api_urls(self) -> None:
        """Test cloud API URL constants."""
        from custom_components.wattpilot.const import (
            CLOUD_API_URL_POSTFIX,
            CLOUD_API_URL_PREFIX,
        )

        assert CLOUD_API_URL_PREFIX == "https://"
        assert ".api.v3.go-e.io/api/" in CLOUD_API_URL_POSTFIX

    def test_event_constants(self) -> None:
        """Test event constants."""
        from custom_components.wattpilot.const import EVENT_PROPS, EVENT_PROPS_ID

        assert EVENT_PROPS_ID == "wattpilot_property_message"
        assert isinstance(EVENT_PROPS, list)


class TestManifest:
    """Test manifest configuration."""

    def test_manifest_loads(self) -> None:
        """Test manifest.json loads correctly."""
        import json
        from pathlib import Path

        manifest_path = (
            Path(__file__).parent.parent / "custom_components/wattpilot/manifest.json"
        )
        with manifest_path.open() as f:
            manifest = json.load(f)

        assert manifest["domain"] == "wattpilot"
        assert manifest["name"] == "Fronius Wattpilot"
        assert manifest["config_flow"] is True

    def test_manifest_has_required_fields(self) -> None:
        """Test manifest has all required fields."""
        import json
        from pathlib import Path

        manifest_path = (
            Path(__file__).parent.parent / "custom_components/wattpilot/manifest.json"
        )
        with manifest_path.open() as f:
            manifest = json.load(f)

        required_fields = [
            "domain",
            "name",
            "version",
            "config_flow",
            "documentation",
            "requirements",
        ]
        for field in required_fields:
            assert field in manifest, f"Missing required field: {field}"

    def test_manifest_iot_class(self) -> None:
        """Test manifest has correct IoT class."""
        import json
        from pathlib import Path

        manifest_path = (
            Path(__file__).parent.parent / "custom_components/wattpilot/manifest.json"
        )
        with manifest_path.open() as f:
            manifest = json.load(f)

        # Should be local_push since it uses WebSocket
        assert manifest["iot_class"] == "local_push"

    def test_manifest_no_yaml_dependencies(self) -> None:
        """Test manifest no longer requires pyyaml or aiofiles."""
        import json
        from pathlib import Path

        manifest_path = (
            Path(__file__).parent.parent / "custom_components/wattpilot/manifest.json"
        )
        with manifest_path.open() as f:
            manifest = json.load(f)

        requirements = manifest.get("requirements", [])
        for req in requirements:
            assert "pyyaml" not in req.lower(), "pyyaml should be removed"
            assert "aiofiles" not in req.lower(), "aiofiles should be removed"
            assert "importlib_metadata" not in req.lower(), (
                "importlib_metadata should be removed"
            )


class TestEntityDescriptions:
    """Test entity descriptions replaced YAML configurations."""

    def test_all_platform_descriptions_exist(self) -> None:
        """Test all platform description lists exist in descriptions module."""
        from custom_components.wattpilot.descriptions import (
            BUTTON_DESCRIPTIONS,
            NUMBER_DESCRIPTIONS,
            SELECT_DESCRIPTIONS,
            SENSOR_DESCRIPTIONS,
            SWITCH_DESCRIPTIONS,
            UPDATE_DESCRIPTIONS,
        )

        assert len(SENSOR_DESCRIPTIONS) > 0
        assert len(SWITCH_DESCRIPTIONS) > 0
        assert len(NUMBER_DESCRIPTIONS) > 0
        assert len(SELECT_DESCRIPTIONS) > 0
        assert len(BUTTON_DESCRIPTIONS) > 0
        assert len(UPDATE_DESCRIPTIONS) > 0

    def test_all_descriptions_have_charger_key(self) -> None:
        """Test all entity descriptions have a charger_key."""
        from custom_components.wattpilot.descriptions import (
            BUTTON_DESCRIPTIONS,
            NUMBER_DESCRIPTIONS,
            SELECT_DESCRIPTIONS,
            SENSOR_DESCRIPTIONS,
            SWITCH_DESCRIPTIONS,
            UPDATE_DESCRIPTIONS,
        )

        all_descriptions = [
            *SENSOR_DESCRIPTIONS,
            *SWITCH_DESCRIPTIONS,
            *NUMBER_DESCRIPTIONS,
            *SELECT_DESCRIPTIONS,
            *BUTTON_DESCRIPTIONS,
            *UPDATE_DESCRIPTIONS,
        ]
        for desc in all_descriptions:
            assert desc.charger_key, f"Description {desc.key} missing charger_key"

    def test_description_keys_are_unique(self) -> None:
        """Test that description keys (with uid fallback) are unique per platform."""
        from custom_components.wattpilot.descriptions import (
            BUTTON_DESCRIPTIONS,
            NUMBER_DESCRIPTIONS,
            SELECT_DESCRIPTIONS,
            SENSOR_DESCRIPTIONS,
            SWITCH_DESCRIPTIONS,
            UPDATE_DESCRIPTIONS,
        )

        for name, descs in [
            ("sensor", SENSOR_DESCRIPTIONS),
            ("switch", SWITCH_DESCRIPTIONS),
            ("number", NUMBER_DESCRIPTIONS),
            ("select", SELECT_DESCRIPTIONS),
            ("button", BUTTON_DESCRIPTIONS),
            ("update", UPDATE_DESCRIPTIONS),
        ]:
            keys = [d.uid or d.charger_key for d in descs]
            seen: set[str] = set()
            duplicates = []
            for key in keys:
                if key in seen:
                    duplicates.append(key)
                seen.add(key)
            assert not duplicates, f"Duplicate keys in {name}: {duplicates}"
