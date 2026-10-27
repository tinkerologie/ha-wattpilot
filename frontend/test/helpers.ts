import type { HassEntity, HomeAssistant } from "../src/types";
import { ROLES, type Role } from "../src/entities";

export const DEVICE_ID = "dev1";

export function entity(
  entityId: string,
  state: string,
  attributes: Record<string, unknown> = {}
): HassEntity {
  return { entity_id: entityId, state, attributes, last_changed: "", last_updated: "" };
}

/** Default live-like states for every role, keyed by role. */
export function defaultStates(): Partial<Record<Role, HassEntity>> {
  return {
    car_state: entity("sensor.wp_car_state", "Idle"),
    charging_power: entity("sensor.wp_power", "0", {
      unit_of_measurement: "W",
      L1_Voltage: 230,
      L2_Voltage: 231,
      L3_Voltage: 229,
      L1_Ampere: 0,
      L2_Ampere: 0,
      L3_Ampere: 0,
      L1_PowerRelative: 0,
    }),
    session_energy: entity("sensor.wp_session", "7300", { unit_of_measurement: "Wh" }),
    phases_in_use: entity("sensor.wp_phases", "1"),
    cable_current_limit: entity("sensor.wp_cable", "32", { unit_of_measurement: "A" }),
    pv_power: entity("sensor.wp_pv", "1700", { unit_of_measurement: "W" }),
    grid_power: entity("sensor.wp_grid", "-400", { unit_of_measurement: "W" }),
    battery_power: entity("sensor.wp_battery", "-2500", { unit_of_measurement: "W" }),
    battery_soc: entity("sensor.wp_soc", "88.2", { unit_of_measurement: "%" }),
    plug_connected: entity("binary_sensor.wp_plug", "off"),
    charging: entity("binary_sensor.wp_charging", "off"),
    start_charging: entity("button.wp_start", "unknown"),
    stop_charging: entity("button.wp_stop", "unknown"),
    start_charging_force: entity("button.wp_force", "unknown"),
    charging_mode: entity("select.wp_mode", "Eco", { options: ["Default", "Eco", "Next Trip"] }),
    phase_switch: entity("select.wp_phase", "Auto", { options: ["Auto", "1 Phase", "3 Phases"] }),
    max_charging_current: entity("number.wp_amp", "32", {
      unit_of_measurement: "A",
      min: 6,
      max: 32,
      step: 1,
    }),
    start_charging_at: entity("number.wp_fst", "1400", { unit_of_measurement: "W" }),
    pv_battery_threshold: entity("number.wp_fam", "100", { unit_of_measurement: "%" }),
    pv_battery_discharges_until: entity("number.wp_pdt", "80", { unit_of_measurement: "%" }),
    discharge_pv_battery: entity("switch.wp_pdte", "off"),
    next_trip_time: entity("time.wp_ftt", "06:00:00"),
    next_trip_charging: entity("number.wp_fte", "18000", {
      unit_of_measurement: "Wh",
      min: 0,
      max: 999999,
    }),
    remain_in_eco_mode: entity("switch.wp_fre", "on"),
  };
}

export interface MockHass extends HomeAssistant {
  calls: unknown[][];
}

export function createHass(
  overrides: Partial<Record<Role, HassEntity | undefined>> = {},
  language = "en"
): MockHass {
  const byRole = { ...defaultStates(), ...overrides };
  const states: HomeAssistant["states"] = {};
  const entities: HomeAssistant["entities"] = {};
  for (const [role, stateObj] of Object.entries(byRole)) {
    if (!stateObj) continue;
    states[stateObj.entity_id] = stateObj;
    entities[stateObj.entity_id] = {
      entity_id: stateObj.entity_id,
      device_id: DEVICE_ID,
      platform: "wattpilot",
      translation_key: ROLES[role as Role].key,
    };
  }
  const calls: unknown[][] = [];
  return {
    calls,
    states,
    entities,
    devices: { [DEVICE_ID]: { id: DEVICE_ID, name: "Wattpilot 91003723" } },
    locale: { language },
    config: { unit_system: { length: "km" } },
    callService: (...args: unknown[]) => {
      calls.push(args);
      return Promise.resolve();
    },
  };
}

export async function mount<T extends HTMLElement & { updateComplete: Promise<boolean> }>(
  tag: string,
  hass: HomeAssistant,
  config: Record<string, unknown> = {}
): Promise<T> {
  const element = document.createElement(tag) as T & {
    setConfig(config: Record<string, unknown>): void;
    hass: HomeAssistant;
  };
  element.setConfig({ type: `custom:${tag}`, device_id: DEVICE_ID, ...config });
  element.hass = hass;
  document.body.append(element);
  await element.updateComplete;
  return element;
}

export function shadow(element: HTMLElement): ShadowRoot {
  if (!element.shadowRoot) throw new Error("no shadow root");
  return element.shadowRoot;
}

export function text(element: HTMLElement): string {
  return (shadow(element).textContent ?? "").replace(/\s+/g, " ").trim();
}
