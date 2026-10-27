import { afterEach, describe, expect, it, vi } from "vitest";
import "../src/index";
import { WattpilotChargerCard } from "../src/cards/charger-card";
import { WattpilotModeCard } from "../src/cards/mode-card";
import { WattpilotNextTripCard } from "../src/cards/next-trip-card";
import { createHass, entity, mount, shadow, text } from "./helpers";

type Card = HTMLElement & {
  updateComplete: Promise<boolean>;
  hass: ReturnType<typeof createHass>;
  setConfig(config: unknown): void;
  getCardSize(): number;
  getGridOptions(): Record<string, unknown>;
};

afterEach(() => {
  document.body.innerHTML = "";
});

function click(card: HTMLElement, selector: string, index = 0): void {
  const element = shadow(card).querySelectorAll<HTMLElement>(selector)[index];
  if (!element) throw new Error(`no element ${selector}[${index}]`);
  element.click();
}

describe("shared card behaviour", () => {
  it("exposes editor, stub and sizing APIs", () => {
    const hass = createHass();
    expect(WattpilotChargerCard.getStubConfig(hass)).toEqual({ device_id: "dev1" });
    expect(WattpilotChargerCard.getStubConfig(createHass({}))).toEqual({ device_id: "dev1" });
    expect(
      WattpilotChargerCard.getStubConfig({ ...hass, entities: {}, devices: {} })
    ).toEqual({});
    expect(WattpilotChargerCard.getConfigForm().schema[0]?.name).toBe("device_id");
    expect(WattpilotModeCard.getConfigForm().schema.length).toBeGreaterThan(2);
    expect(WattpilotNextTripCard.getConfigForm().schema.length).toBeGreaterThan(2);
  });

  it("validates configuration", () => {
    const card = document.createElement("wattpilot-charger-card") as Card;
    expect(() => card.setConfig(null)).toThrow("Invalid configuration");
    expect(() => card.setConfig({ type: "x", entities: "nope" })).toThrow("entities");
  });

  it("warns when no charger is selected", async () => {
    const card = await mount<Card>("wattpilot-mode-card", createHass(), { device_id: "missing" });
    expect(text(card)).toContain("No Wattpilot charger found");
    expect(shadow(card).querySelector('[role="alert"]')).not.toBeNull();
  });

  it("only re-renders for relevant state changes", async () => {
    const hass = createHass();
    const card = (await mount<Card>("wattpilot-next-trip-card", hass)) as Card & {
      shouldUpdate(changed: Map<string, unknown>): boolean;
    };
    const unrelated = { ...hass, states: { ...hass.states, "light.x": entity("light.x", "on") } };
    card.hass = unrelated;
    expect(card.shouldUpdate(new Map([["hass", hass]]))).toBe(false);
    const relevant = {
      ...unrelated,
      states: { ...unrelated.states, "time.wp_ftt": entity("time.wp_ftt", "07:00:00") },
    };
    card.hass = relevant;
    expect(card.shouldUpdate(new Map([["hass", unrelated]]))).toBe(true);
    card.hass = { ...relevant, locale: { language: "de" } };
    expect(card.shouldUpdate(new Map([["hass", relevant]]))).toBe(true);
    expect(card.shouldUpdate(new Map([["hass", undefined]]))).toBe(true);
    expect(card.shouldUpdate(new Map([["config", {}]]))).toBe(true);
  });
});

describe("wattpilot-charger-card", () => {
  it("shows the idle state with live solar flow and a disabled start button", async () => {
    const card = await mount<Card>("wattpilot-charger-card", createHass());
    const content = text(card);
    expect(content).toContain("Wattpilot 91003723");
    expect(content).toContain("Connect your car");
    expect(content).toContain("1.7 kW");
    expect(content).toContain("-2.5 kW");
    expect(content).toContain("41km"); // 7.3 kWh at 18 kWh/100 km
    expect(shadow(card).querySelector<HTMLButtonElement>(".actions button")?.disabled).toBe(true);
    expect(card.getCardSize()).toBe(9);
    expect(card.getGridOptions()).toMatchObject({ columns: 12, min_columns: 6 });
  });

  it("shows charging progress and stops charging", async () => {
    const hass = createHass({
      car_state: entity("sensor.wp_car_state", "Charging"),
      charging_power: entity("sensor.wp_power", "4140", { unit_of_measurement: "W" }),
    });
    const card = await mount<Card>("wattpilot-charger-card", hass, { consumption: 20 });
    expect(text(card)).toContain("Charging");
    expect(text(card)).toContain("21 km/h");
    const ring = shadow(card).querySelector(".ring-progress");
    expect(Number(ring?.getAttribute("stroke-dashoffset"))).toBeGreaterThan(0);
    click(card, ".actions button");
    expect(hass.calls).toEqual([["button", "press", {}, { entity_id: "button.wp_stop" }]]);
  });

  it("falls back to plug and charging sensors and confirms force start", async () => {
    const hass = createHass({
      car_state: undefined,
      plug_connected: entity("binary_sensor.wp_plug", "on"),
    });
    const card = await mount<Card>("wattpilot-charger-card", hass, { show_force_start: true });
    expect(text(card)).toContain("Ready to charge");
    const actions = vi.fn();
    card.addEventListener("hass-action", actions);
    click(card, ".actions button", 1);
    expect(actions.mock.calls[0]?.[0].detail.config.tap_action.confirmation.text).toContain(
      "Force charging"
    );
    click(card, ".actions button", 0);
    expect(hass.calls).toEqual([["button", "press", {}, { entity_id: "button.wp_start" }]]);

    card.setConfig({ type: "x", device_id: "dev1", show_force_start: true, confirm_force_start: false });
    await card.updateComplete;
    click(card, ".actions button", 1);
    expect(hass.calls.at(-1)).toEqual(["button", "press", {}, { entity_id: "button.wp_force" }]);
  });

  it("reports charging and unavailable chargers without a car state", async () => {
    const charging = await mount<Card>(
      "wattpilot-charger-card",
      createHass({
        car_state: undefined,
        charging: entity("binary_sensor.wp_charging", "on"),
      })
    );
    expect(text(charging)).toContain("Your car is charging");
    const offline = await mount<Card>(
      "wattpilot-charger-card",
      createHass({
        car_state: undefined,
        charging: entity("binary_sensor.wp_charging", "unavailable"),
        plug_connected: entity("binary_sensor.wp_plug", "unavailable"),
      })
    );
    expect(text(offline)).toContain("Charger unavailable");
    const complete = await mount<Card>(
      "wattpilot-charger-card",
      createHass({ car_state: entity("sensor.wp_car_state", "Complete") })
    );
    expect(text(complete)).toContain("Charging complete");
  });

  it("switches to the PV page by tab, keyboard and swipe", async () => {
    const hass = createHass();
    const card = await mount<Card>("wattpilot-charger-card", hass);
    click(card, '[role="tab"]', 1);
    await card.updateComplete;
    expect(text(card)).toContain("PV quick settings");
    expect(text(card)).toContain("PV surplus");
    expect(text(card)).toContain("400W"); // export 400 W, car idle
    expect(text(card)).toContain("88.2%");

    const tablist = shadow(card).querySelector('[role="tablist"]')!;
    tablist.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await card.updateComplete;
    expect(text(card)).toContain("Connect your car");
    tablist.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await card.updateComplete;
    expect(text(card)).toContain("PV surplus");
    tablist.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

    const haCard = shadow(card).querySelector("ha-card")!;
    const pointer = (type: string, clientX: number, pointerType = "touch") =>
      haCard.dispatchEvent(Object.assign(new Event(type), { clientX, pointerType }));
    pointer("pointerdown", 200);
    pointer("pointerup", 300);
    await card.updateComplete;
    expect(text(card)).toContain("Connect your car");
    pointer("pointerdown", 200, "mouse");
    pointer("pointerup", 50);
    pointer("pointerdown", 200);
    pointer("pointerup", 190);
    await card.updateComplete;
    expect(text(card)).toContain("Connect your car");

    const actions = vi.fn();
    card.addEventListener("hass-action", actions);
    click(card, '[role="tab"]', 1);
    await card.updateComplete;
    click(card, ".threshold button");
    expect(actions.mock.calls[0]?.[0].detail.config.entity).toBe("number.wp_fst");
  });

  it("hides optional sections and shows charger information", async () => {
    const hass = createHass({
      pv_power: undefined,
      grid_power: undefined,
      battery_power: undefined,
      start_charging_at: undefined,
      pv_battery_threshold: undefined,
    });
    const card = await mount<Card>("wattpilot-charger-card", hass, { title: "Garage" });
    expect(shadow(card).querySelector(".flow")).toBeNull();
    expect(shadow(card).querySelector('[role="tablist"]')).toBeNull();
    expect(text(card)).toContain("Garage");
    click(card, ".header .icon-button");
    await card.updateComplete;
    expect(text(card)).toContain("1~ (0 A)");
    expect(text(card)).toContain("1~ (230 V)");
    expect(text(card)).toContain("Type 2");
    expect(text(card)).toContain("32A");
  });

  it("offers itself for wattpilot status entities in the card picker", () => {
    const entry = window.customCards?.find((card) => card.type === "wattpilot-charger-card");
    const hass = createHass();
    expect(entry?.getEntitySuggestion?.(hass, "sensor.wp_power")).toEqual({
      config: { type: "custom:wattpilot-charger-card", device_id: "dev1" },
    });
    expect(entry?.getEntitySuggestion?.(hass, "sensor.wp_pv")).toBeNull();
  });
});

describe("wattpilot-mode-card", () => {
  it("selects modes by click and keyboard", async () => {
    const hass = createHass();
    const card = await mount<Card>("wattpilot-mode-card", hass);
    expect(text(card)).toContain("Sustainable & cost-efficient");
    const radios = shadow(card).querySelectorAll('[role="radio"]');
    expect(radios[1]?.getAttribute("aria-checked")).toBe("true");
    click(card, '[role="radio"]', 0);
    click(card, '[role="radio"]', 1); // already active: no call
    const group = shadow(card).querySelector('[role="radiogroup"]')!;
    for (const key of ["ArrowRight", "ArrowLeft", "End", "Home", "ArrowDown", "ArrowUp", "a"]) {
      group.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    }
    expect(hass.calls.map((call) => (call[2] as { option: string }).option)).toEqual([
      "Default",
      "Next Trip",
      "Default",
      "Next Trip",
      "Default",
      "Next Trip",
      "Default",
    ]);
  });

  it("controls PV battery charging, charging speed and phase mode", async () => {
    const hass = createHass();
    const card = await mount<Card>("wattpilot-mode-card", hass, { show_phase_mode: true });
    expect(text(card)).toContain("Charging speed");
    expect(text(card)).toContain("32 A");
    click(card, ".battery-actions .pill-button");
    expect(hass.calls.at(-1)).toEqual(["switch", "turn_on", {}, { entity_id: "switch.wp_pdte" }]);

    const select = shadow(card).querySelector("select")!;
    select.value = "3 Phases";
    select.dispatchEvent(new Event("change"));
    expect(hass.calls.at(-1)).toEqual([
      "select",
      "select_option",
      { option: "3 Phases" },
      { entity_id: "select.wp_phase" },
    ]);

    const actions = vi.fn();
    card.addEventListener("hass-action", actions);
    click(card, ".row-button");
    click(card, ".settings-button");
    expect(actions.mock.calls.map(([event]) => event.detail.config.entity)).toEqual([
      "number.wp_amp",
      "number.wp_pdt",
    ]);
  });

  it("shows stop while PV battery charging is active and hides optional rows", async () => {
    const hass = createHass({
      discharge_pv_battery: entity("switch.wp_pdte", "on"),
      pv_battery_discharges_until: undefined,
    });
    const card = await mount<Card>("wattpilot-mode-card", hass, {
      show_charging_speed: false,
      title: "Modes",
    });
    expect(text(card)).toContain("Stop");
    expect(text(card)).toContain("Modes");
    expect(shadow(card).querySelector(".settings-button")).toBeNull();
    expect(shadow(card).querySelector(".row-button")).toBeNull();
    click(card, ".battery-actions .pill-button");
    expect(hass.calls.at(-1)?.[1]).toBe("turn_off");
  });
});

describe("wattpilot-next-trip-card", () => {
  it("edits departure time, energy and the eco switch", async () => {
    const hass = createHass();
    const card = await mount<Card>("wattpilot-next-trip-card", hass);
    expect(text(card)).toContain("Next trip charging is not active.");

    const time = shadow(card).querySelector<HTMLInputElement>('input[type="time"]')!;
    expect(time.value).toBe("06:00");
    time.value = "07:30";
    time.dispatchEvent(new Event("change"));
    time.value = "";
    time.dispatchEvent(new Event("change"));

    const energy = shadow(card).querySelector<HTMLInputElement>('input[type="number"]')!;
    expect(energy.value).toBe("18");
    energy.value = "20.5";
    energy.dispatchEvent(new Event("change"));
    energy.value = "";
    energy.dispatchEvent(new Event("change"));

    const eco = shadow(card).querySelector<HTMLInputElement>('input[role="switch"]')!;
    eco.checked = false;
    eco.dispatchEvent(new Event("change"));

    click(card, ".hint .pill-button");

    expect(hass.calls).toEqual([
      ["time", "set_value", { time: "07:30:00" }, { entity_id: "time.wp_ftt" }],
      ["number", "set_value", { value: 20500 }, { entity_id: "number.wp_fte" }],
      ["switch", "turn_off", {}, { entity_id: "switch.wp_fre" }],
      ["select", "select_option", { option: "Next Trip" }, { entity_id: "select.wp_mode" }],
    ]);
    expect(card.getGridOptions()).toMatchObject({ columns: 12, min_columns: 6 });
  });

  it("hides the hint in Next trip mode and supports non-Wh energy units", async () => {
    const hass = createHass({
      charging_mode: entity("select.wp_mode", "Next Trip", { options: ["Default"] }),
      next_trip_charging: entity("number.wp_fte", "20", { unit_of_measurement: "kWh", step: 1 }),
      next_trip_time: entity("time.wp_ftt", "unavailable"),
    });
    const card = await mount<Card>("wattpilot-next-trip-card", hass, {
      show_remain_in_eco: false,
    });
    expect(text(card)).not.toContain("not active");
    expect(shadow(card).querySelector('input[role="switch"]')).toBeNull();
    expect(shadow(card).querySelector<HTMLInputElement>('input[type="time"]')?.disabled).toBe(true);
    const energy = shadow(card).querySelector<HTMLInputElement>('input[type="number"]')!;
    energy.value = "25";
    energy.dispatchEvent(new Event("change"));
    expect(hass.calls).toEqual([
      ["number", "set_value", { value: 25 }, { entity_id: "number.wp_fte" }],
    ]);
  });

  it("offers no switch button when the mode select has no Next trip option", async () => {
    const hass = createHass({
      charging_mode: entity("select.wp_mode", "Eco", { options: ["Default", "Eco"] }),
    });
    const card = await mount<Card>("wattpilot-next-trip-card", hass);
    expect(text(card)).toContain("not active");
    expect(shadow(card).querySelector(".hint .pill-button")).toBeNull();
  });
});
