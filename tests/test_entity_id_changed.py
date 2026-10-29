"""Entities opt in to Home Assistant 2026.11's in-place entity ID changes."""

from __future__ import annotations

import importlib
import pkgutil
from typing import Any
from unittest.mock import MagicMock

import pytest
from homeassistant.helpers.entity import Entity

import custom_components.wattpilot as integration
from custom_components.wattpilot.button import ChargerButton
from custom_components.wattpilot.entities import (
    ChargerPlatformEntity,
    async_delegate_entity_id_changed,
)

# Home Assistant's _entity_class_requires_readd: a class outside Home Assistant
# that defines one of these must be covered by a class (itself or a subclass in
# the MRO) that defines async_entity_id_changed.
ADD_REMOVE_METHODS = (
    "async_prepare_to_add_to_hass",
    "async_added_to_hass",
    "async_will_remove_from_hass",
)
OPTED_IN = (ChargerPlatformEntity, ChargerButton)


def _integration_entity_classes() -> list[type[Entity]]:
    for module in pkgutil.walk_packages(
        integration.__path__, f"{integration.__name__}."
    ):
        importlib.import_module(module.name)
    found: set[type[Entity]] = set()
    pending = [Entity]
    while pending:
        for subclass in pending.pop().__subclasses__():
            if subclass not in found:
                found.add(subclass)
                pending.append(subclass)
    return [cls for cls in found if cls.__module__.startswith(integration.__name__)]


def _requires_readd(entity_class: type[Entity]) -> bool:
    mro = [
        cls
        for cls in entity_class.__mro__
        if not cls.__module__.startswith("homeassistant.")
    ]
    owners = [cls for cls in mro if "async_entity_id_changed" in cls.__dict__]
    return any(
        any(method in cls.__dict__ for method in ADD_REMOVE_METHODS)
        and not any(issubclass(owner, cls) for owner in owners)
        for cls in mro
    )


def test_every_entity_class_changes_its_entity_id_in_place() -> None:
    """No entity class falls back to the re-add Home Assistant 2027.11 removes."""
    classes = _integration_entity_classes()
    assert set(OPTED_IN) <= set(classes)
    assert [cls.__qualname__ for cls in classes if _requires_readd(cls)] == []


def test_requires_readd_flags_an_uncovered_hook() -> None:
    """The guard reports a subclass that adds its own hook without opting in."""

    class Uncovered(ChargerPlatformEntity):
        async def async_will_remove_from_hass(self) -> None:
            """Override a remove hook without async_entity_id_changed."""

    assert _requires_readd(Uncovered)
    assert not _requires_readd(ChargerPlatformEntity)


def test_delegate_calls_the_parent_hook() -> None:
    """A parent with the hook is called with the old entity ID."""
    parent = MagicMock()
    async_delegate_entity_id_changed(parent, "sensor.old")
    parent.async_entity_id_changed.assert_called_once_with("sensor.old")


def test_delegate_skips_a_parent_without_the_hook() -> None:
    """Before Home Assistant 2026.11 there is nothing to call."""
    async_delegate_entity_id_changed(object(), "sensor.old")


@pytest.mark.parametrize("entity_class", OPTED_IN, ids=lambda cls: cls.__name__)
def test_hook_reaches_home_assistant_through_the_mro(
    entity_class: type[Any], monkeypatch: pytest.MonkeyPatch
) -> None:
    """Each hook passes the change on to Home Assistant's own bookkeeping."""
    entity = object.__new__(entity_class)
    monkeypatch.delattr(Entity, "async_entity_id_changed", raising=False)
    entity.async_entity_id_changed("sensor.old")

    calls: list[str] = []
    monkeypatch.setattr(
        Entity,
        "async_entity_id_changed",
        lambda _self, old_entity_id: calls.append(old_entity_id),
        raising=False,
    )
    entity.async_entity_id_changed("sensor.old")

    assert calls == ["sensor.old"]
