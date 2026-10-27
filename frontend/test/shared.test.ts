import { describe, expect, it, vi } from "vitest";
import { openMoreInfo, pressButton, selectOption, setNumber, setSwitch, setTime } from "../src/actions";
import {
  isAvailable,
  numericAttribute,
  numericState,
  resolveEntity,
  resolveEntityId,
  wattpilotDevices,
  deviceName,
} from "../src/entities";
import {
  distanceUnit,
  energyToDistance,
  energyWh,
  formatEnergy,
  formatPower,
  formatState,
  powerWatts,
  stateParts,
} from "../src/format";
import { buildConfigForm } from "../src/form";
import { language, localize, localizeOptional } from "../src/localize";
import { registerCard } from "../src/register";
import { DEVICE_ID, createHass, entity } from "./helpers";

describe("entity resolution", () => {
  it("finds wattpilot devices from the entity registry", () => {
    const hass = createHass();
    hass.entities["light.other"] = { entity_id: "light.other", device_id: "x", platform: "hue" };
    expect(wattpilotDevices(hass).map((device) => device.id)).toEqual([DEVICE_ID]);
    expect(deviceName({ id: "a", name: "Charger", name_by_user: "Garage" })).toBe("Garage");
    expect(deviceName(undefined)).toBeUndefined();
  });

  it("resolves by translation key, honours overrides and prefers live entities", () => {
    const hass = createHass();
    const config = { type: "x", device_id: DEVICE_ID };
    expect(resolveEntityId(hass, config, "charging_power")).toBe("sensor.wp_power");
    expect(
      resolveEntityId(hass, { ...config, entities: { charging_power: "sensor.custom" } }, "charging_power")
    ).toBe("sensor.custom");
    expect(resolveEntityId(hass, { type: "x" }, "charging_power")).toBeUndefined();

    hass.states["sensor.stale_power"] = entity("sensor.stale_power", "unavailable");
    hass.entities = {
      "sensor.stale_power": {
        entity_id: "sensor.stale_power",
        device_id: DEVICE_ID,
        platform: "wattpilot",
        translation_key: "charging_power",
      },
      ...hass.entities,
    };
    expect(resolveEntityId(hass, config, "charging_power")).toBe("sensor.wp_power");

    hass.states["sensor.wp_power"] = entity("sensor.wp_power", "unknown");
    expect(resolveEntityId(hass, config, "charging_power")).toBe("sensor.stale_power");
    expect(resolveEntity(hass, config, "pv_power")?.state).toBe("1700");
  });

  it("reads numeric states and attributes defensively", () => {
    expect(isAvailable(undefined)).toBe(false);
    expect(numericState(entity("s.a", "12.5"))).toBe(12.5);
    expect(numericState(entity("s.a", "abc"))).toBeUndefined();
    expect(numericState(entity("s.a", " "))).toBeUndefined();
    expect(numericAttribute(entity("s.a", "1", { min: "6" }), "min")).toBe(6);
    expect(numericAttribute(entity("s.a", "1", { min: null }), "min")).toBeUndefined();
    expect(numericAttribute(entity("s.a", "1", { min: "x" }), "min")).toBeUndefined();
  });
});

describe("formatting", () => {
  const hass = createHass();

  it("normalises power and energy units", () => {
    expect(powerWatts(entity("s.p", "1.5", { unit_of_measurement: "kW" }))).toBe(1500);
    expect(powerWatts(entity("s.p", "3"))).toBe(3);
    expect(energyWh(entity("s.e", "2", { unit_of_measurement: "kWh" }))).toBe(2000);
    expect(formatPower(hass, 1400)).toEqual({ value: "1.4", unit: "kW" });
    expect(formatPower(hass, 11)).toEqual({ value: "11", unit: "W" });
    expect(formatPower(hass, undefined).value).toBe("–");
    expect(formatEnergy(hass, 7300)).toEqual({ value: "7.3", unit: "kWh" });
    expect(formatEnergy(hass, 123_456)).toEqual({ value: "123.5", unit: "kWh" });
    expect(formatEnergy(hass, undefined).value).toBe("–");
  });

  it("uses the locale and the unit system", () => {
    expect(formatPower(createHass({}, "de"), 1400).value).toBe("1,4");
    expect(formatPower({ locale: { language: "not a locale!" } }, 1400).value).toBe("1.4");
    expect(distanceUnit(hass)).toBe("km");
    const imperial = { ...hass, config: { unit_system: { length: "mi" } } };
    expect(distanceUnit(imperial)).toBe("mi");
    expect(energyToDistance(hass, 18_000, 18)).toBe(100);
    expect(energyToDistance(imperial, 18_000, 18)).toBeCloseTo(62.14, 1);
    expect(energyToDistance(hass, undefined, 18)).toBeUndefined();
    expect(energyToDistance(hass, 1000, 0)).toBeUndefined();
  });

  it("formats states with Home Assistant when available", () => {
    const stateObj = entity("s.t", "5", { unit_of_measurement: "A", display_precision: 0 });
    expect(formatState(hass, stateObj)).toBe("5 A");
    expect(formatState(hass, entity("s.t", "unavailable", { unit_of_measurement: "A" }))).toBe(
      "unavailable"
    );
    expect(formatState(hass, undefined)).toBe("–");
    expect(formatState({ ...hass, formatEntityState: () => "five amps" }, stateObj)).toBe(
      "five amps"
    );
    expect(stateParts(hass, stateObj)).toEqual({ value: "5", unit: "A" });
    expect(stateParts(hass, entity("s.t", "unknown"))).toEqual({ value: "–", unit: "" });
  });
});

describe("localisation", () => {
  it("falls back to English and replaces placeholders", () => {
    expect(language({ locale: { language: "de-AT" } })).toBe("de");
    expect(language(undefined)).toBe("en");
    expect(localize({ locale: { language: "de" } }, "label.start")).toBe("Starten");
    expect(localize({ locale: { language: "fr" } }, "label.start")).toBe("Start");
    expect(localize({ locale: { language: "de" } }, "label.per_hour", { value: "5 km" })).toBe(
      "5 km/h"
    );
    expect(localizeOptional(undefined, "label.mode.Eco", "x")).toBe("Eco");
    expect(localizeOptional(undefined, "label.mode.Turbo", "Turbo")).toBe("Turbo");
  });
});

describe("actions", () => {
  it("calls services with entity targets", async () => {
    const hass = createHass();
    await selectOption(hass, "select.a", "Eco");
    await setNumber(hass, "number.a", 3);
    await setTime(hass, "time.a", "06:00:00");
    await setSwitch(hass, "switch.a", true);
    await setSwitch(hass, "switch.a", false);
    pressButton(document.body, hass, "button.a");
    expect(hass.calls).toEqual([
      ["select", "select_option", { option: "Eco" }, { entity_id: "select.a" }],
      ["number", "set_value", { value: 3 }, { entity_id: "number.a" }],
      ["time", "set_value", { time: "06:00:00" }, { entity_id: "time.a" }],
      ["switch", "turn_on", {}, { entity_id: "switch.a" }],
      ["switch", "turn_off", {}, { entity_id: "switch.a" }],
      ["button", "press", {}, { entity_id: "button.a" }],
    ]);
  });

  it("delegates more-info and confirmations to hass-action", () => {
    const node = document.createElement("div");
    const listener = vi.fn();
    node.addEventListener("hass-action", listener);
    openMoreInfo(node, "sensor.a");
    pressButton(node, createHass(), "button.force", "Sure?");
    const details = listener.mock.calls.map(([event]) => (event as CustomEvent).detail);
    expect(details[0]).toEqual({
      config: { entity: "sensor.a", tap_action: { action: "more-info" } },
      action: "tap",
    });
    expect(details[1].config.tap_action).toMatchObject({
      action: "perform-action",
      perform_action: "button.press",
      confirmation: { text: "Sure?" },
    });
  });
});

describe("editor form", () => {
  it("builds a device-scoped schema with labels and helpers", () => {
    document.documentElement.lang = "de";
    const form = buildConfigForm({
      consumption: true,
      toggles: [{ name: "show_power_flow", default: true }],
      roles: ["charging_power"],
    });
    const names = form.schema.map((field) => field.name);
    expect(names).toEqual(["device_id", "title", "consumption", "", "entities"]);
    expect(form.schema[0]?.selector).toEqual({
      device: { filter: [{ integration: "wattpilot" }] },
    });
    expect(form.computeLabel({ name: "device_id" })).toBe("Ladestation");
    expect(form.computeLabel({ name: "charging_power" })).toBe("Charging power");
    expect(form.computeLabel({ name: "other" })).toBe("other");
    expect(form.computeHelper({ name: "consumption" })).toContain("Reichweite");
    expect(form.computeHelper({ name: "entities" })).toContain("Optional");
    expect(form.computeHelper({ name: "title" })).toBeUndefined();
    document.documentElement.lang = "en";
    expect(buildConfigForm({ roles: [] }).schema.map((field) => field.name)).toEqual([
      "device_id",
      "title",
      "entities",
    ]);
  });
});

describe("card registration", () => {
  it("registers once with picker metadata", () => {
    class Dummy extends HTMLElement {}
    registerCard("wattpilot-dummy-card", Dummy, "card.mode.name", "card.mode.description");
    registerCard("wattpilot-dummy-card", Dummy, "card.mode.name", "card.mode.description");
    const entries = window.customCards?.filter((card) => card.type === "wattpilot-dummy-card");
    expect(entries).toHaveLength(1);
    expect(entries?.[0]).toMatchObject({ preview: true, name: "Wattpilot charging mode" });
    expect(customElements.get("wattpilot-dummy-card")).toBe(Dummy);
  });
});
