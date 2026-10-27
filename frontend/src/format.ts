import { isAvailable, numericAttribute, numericState } from "./entities";
import type { HassEntity, HomeAssistant } from "./types";

export const PLACEHOLDER = "–";

export interface ValueParts {
  value: string;
  unit: string;
}

function numberFormat(
  hass: Pick<HomeAssistant, "locale"> | undefined,
  maximumFractionDigits: number
): Intl.NumberFormat {
  const locale = hass?.locale?.language || undefined;
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits });
  } catch {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits });
  }
}

export function formatNumber(
  hass: Pick<HomeAssistant, "locale"> | undefined,
  value: number,
  maximumFractionDigits = 0
): string {
  return numberFormat(hass, maximumFractionDigits).format(value);
}

const POWER_FACTORS: Record<string, number> = { W: 1, kW: 1000, MW: 1_000_000 };
const ENERGY_FACTORS: Record<string, number> = { Wh: 1, kWh: 1000, MWh: 1_000_000 };

function scaled(
  entity: HassEntity | undefined,
  factors: Record<string, number>
): number | undefined {
  const value = numericState(entity);
  if (value === undefined) return undefined;
  const unit = entity?.attributes.unit_of_measurement;
  return value * (typeof unit === "string" ? (factors[unit] ?? 1) : 1);
}

/** Power entity value in watts, honouring the entity's display unit. */
export function powerWatts(entity: HassEntity | undefined): number | undefined {
  return scaled(entity, POWER_FACTORS);
}

/** Energy entity value in watt-hours, honouring the entity's display unit. */
export function energyWh(entity: HassEntity | undefined): number | undefined {
  return scaled(entity, ENERGY_FACTORS);
}

export function formatPower(
  hass: Pick<HomeAssistant, "locale"> | undefined,
  watts: number | undefined
): ValueParts {
  if (watts === undefined) return { value: PLACEHOLDER, unit: "W" };
  if (Math.abs(watts) >= 1000) {
    return { value: formatNumber(hass, watts / 1000, 1), unit: "kW" };
  }
  return { value: formatNumber(hass, watts, 0), unit: "W" };
}

export function formatEnergy(
  hass: Pick<HomeAssistant, "locale"> | undefined,
  wh: number | undefined
): ValueParts {
  if (wh === undefined) return { value: PLACEHOLDER, unit: "kWh" };
  return { value: formatNumber(hass, wh / 1000, wh < 10_000 ? 2 : 1), unit: "kWh" };
}

/** Distance unit following the Home Assistant unit system. */
export function distanceUnit(hass: Pick<HomeAssistant, "config"> | undefined): "km" | "mi" {
  return hass?.config?.unit_system?.length === "mi" ? "mi" : "km";
}

const KM_PER_MILE = 1.609344;

/** Distance that `wh` of energy covers at `consumption` kWh/100 km, in the HA unit. */
export function energyToDistance(
  hass: Pick<HomeAssistant, "config"> | undefined,
  wh: number | undefined,
  consumption: number
): number | undefined {
  if (wh === undefined || !(consumption > 0)) return undefined;
  const km = (wh / 1000 / consumption) * 100;
  return distanceUnit(hass) === "mi" ? km / KM_PER_MILE : km;
}

/** Entity state with unit as Home Assistant would display it. */
export function formatState(
  hass: HomeAssistant | undefined,
  entity: HassEntity | undefined
): string {
  if (!entity) return PLACEHOLDER;
  if (hass?.formatEntityState) return hass.formatEntityState(entity);
  const unit = entity.attributes.unit_of_measurement;
  return typeof unit === "string" && isAvailable(entity)
    ? `${entity.state} ${unit}`
    : entity.state;
}

/** Split an entity's state into a value and unit, falling back to its raw state. */
export function stateParts(
  hass: HomeAssistant | undefined,
  entity: HassEntity | undefined
): ValueParts {
  const raw = entity?.attributes.unit_of_measurement;
  const unit = typeof raw === "string" ? raw : "";
  const value = numericState(entity);
  if (value === undefined) return { value: PLACEHOLDER, unit };
  const precision = numericAttribute(entity, "display_precision");
  return { value: formatNumber(hass, value, precision ?? 1), unit };
}
