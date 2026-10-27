import type {
  DeviceRegistryEntry,
  HassEntity,
  HomeAssistant,
  LovelaceCardConfig,
} from "./types";

export const DOMAIN = "wattpilot";

/** Card roles mapped to the entity domain and translation_key in descriptions.py. */
export const ROLES = {
  car_state: { domain: "sensor", key: "car_state" },
  charging_power: { domain: "sensor", key: "charging_power" },
  session_energy: { domain: "sensor", key: "session_energy" },
  total_energy: { domain: "sensor", key: "total_energy" },
  charging_reason: { domain: "sensor", key: "charging_reason" },
  phases_in_use: { domain: "sensor", key: "phases_in_use" },
  cable_current_limit: { domain: "sensor", key: "cable_current_limit" },
  pv_power: { domain: "sensor", key: "pv_power" },
  grid_power: { domain: "sensor", key: "grid_power" },
  battery_power: { domain: "sensor", key: "battery_power" },
  battery_soc: { domain: "sensor", key: "battery_soc" },
  plug_connected: { domain: "binary_sensor", key: "plug_connected" },
  charging: { domain: "binary_sensor", key: "charging" },
  start_charging: { domain: "button", key: "start_charging" },
  stop_charging: { domain: "button", key: "stop_charging" },
  start_charging_force: { domain: "button", key: "start_charging_force" },
  charging_mode: { domain: "select", key: "charging_mode" },
  phase_switch: { domain: "select", key: "phase_switch" },
  max_charging_current: { domain: "number", key: "max_charging_current" },
  start_charging_at: { domain: "number", key: "start_charging_at" },
  pv_battery_threshold: { domain: "number", key: "pv_battery_threshold" },
  pv_battery_discharges_until: {
    domain: "number",
    key: "pv_battery_discharges_until",
  },
  next_trip_charging: { domain: "number", key: "next_trip_charging" },
  next_trip_time: { domain: "time", key: "next_trip_time" },
  remain_in_eco_mode: { domain: "switch", key: "remain_in_eco_mode" },
  pv_surplus: { domain: "switch", key: "pv_surplus" },
  discharge_pv_battery: { domain: "switch", key: "discharge_pv_battery" },
} as const satisfies Record<string, { domain: string; key: string }>;

export type Role = keyof typeof ROLES;

/** Wattpilot devices are those owning at least one wattpilot-platform entity. */
export function wattpilotDevices(hass: HomeAssistant): DeviceRegistryEntry[] {
  const deviceIds = new Set<string>();
  for (const entry of Object.values(hass.entities ?? {})) {
    if (entry.platform === DOMAIN && entry.device_id) deviceIds.add(entry.device_id);
  }
  return [...deviceIds]
    .map((id) => hass.devices?.[id])
    .filter((device): device is DeviceRegistryEntry => device !== undefined);
}

export function deviceName(device: DeviceRegistryEntry | undefined): string | undefined {
  return device?.name_by_user || device?.name || undefined;
}

/**
 * Resolve the entity id for a role: an explicit override wins, otherwise the
 * Wattpilot entity on the configured device with the matching translation_key.
 */
export function resolveEntityId(
  hass: HomeAssistant,
  config: LovelaceCardConfig,
  role: Role
): string | undefined {
  const override = config.entities?.[role];
  if (override) return override;
  if (!config.device_id) return undefined;
  const { domain, key } = ROLES[role];
  // Stale registry entries can share a translation_key; prefer one with a live state.
  let fallback: string | undefined;
  for (const entry of Object.values(hass.entities ?? {})) {
    if (
      entry.platform === DOMAIN &&
      entry.device_id === config.device_id &&
      entry.translation_key === key &&
      entry.entity_id.startsWith(`${domain}.`)
    ) {
      if (isAvailable(hass.states[entry.entity_id])) return entry.entity_id;
      fallback ??= entry.entity_id;
    }
  }
  return fallback;
}

export function resolveEntity(
  hass: HomeAssistant,
  config: LovelaceCardConfig,
  role: Role
): HassEntity | undefined {
  const entityId = resolveEntityId(hass, config, role);
  return entityId ? hass.states[entityId] : undefined;
}

export function isAvailable(entity: HassEntity | undefined): entity is HassEntity {
  return (
    entity !== undefined && entity.state !== "unavailable" && entity.state !== "unknown"
  );
}

/** Buttons stay "unknown" until first pressed, so only "unavailable" blocks them. */
export function isPressable(entity: HassEntity | undefined): entity is HassEntity {
  return entity !== undefined && entity.state !== "unavailable";
}

export function numericState(entity: HassEntity | undefined): number | undefined {
  if (!isAvailable(entity) || entity.state.trim() === "") return undefined;
  const value = Number(entity.state);
  return Number.isFinite(value) ? value : undefined;
}

export function numericAttribute(
  entity: HassEntity | undefined,
  attribute: string
): number | undefined {
  const raw = entity?.attributes[attribute];
  if (raw === null || raw === undefined || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}
