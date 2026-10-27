// Minimal Home Assistant frontend contract used by the Wattpilot cards.
// Kept local on purpose: the frontend repo's internal types are not published.

declare global {
  const __CARD_VERSION__: string;

  interface Window {
    customCards?: CustomCardEntry[];
  }

  interface HTMLElementEventMap {
    "hass-action": CustomEvent<HassActionDetail>;
    "hass-more-info": CustomEvent<{ entityId: string }>;
  }
}

export interface CustomCardEntry {
  type: string;
  name: string;
  description: string;
  preview?: boolean;
  documentationURL?: string;
  getEntitySuggestion?: (hass: HomeAssistant, entityId: string) => EntitySuggestion | null;
}

export interface EntitySuggestion {
  config: LovelaceCardConfig;
  label?: string;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export type HassEntities = Record<string, HassEntity>;

export interface DeviceRegistryEntry {
  id: string;
  name: string | null;
  name_by_user?: string | null;
  identifiers?: [string, string][];
  manufacturer?: string | null;
  model?: string | null;
}

export interface EntityRegistryDisplayEntry {
  entity_id: string;
  device_id?: string | null;
  platform?: string;
  translation_key?: string;
  entity_category?: "config" | "diagnostic" | null;
  hidden?: boolean;
  name?: string | null;
}

export interface FrontendLocaleData {
  language: string;
  number_format?: string;
}

export interface HomeAssistant {
  states: HassEntities;
  entities: Record<string, EntityRegistryDisplayEntry>;
  devices: Record<string, DeviceRegistryEntry>;
  locale: FrontendLocaleData;
  language?: string;
  config: { unit_system: { length: string } };
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: Record<string, unknown>
  ) => Promise<unknown>;
  formatEntityState?: (stateObj: HassEntity, state?: string) => string;
  formatEntityAttributeValue?: (
    stateObj: HassEntity,
    attribute: string,
    value?: unknown
  ) => string;
  formatEntityName?: (
    stateObj: HassEntity,
    type: unknown,
    options?: unknown
  ) => string;
}

export interface ActionConfig {
  action: "more-info" | "perform-action" | "none";
  perform_action?: string;
  data?: Record<string, unknown>;
  target?: { entity_id: string };
  confirmation?: boolean | { text?: string };
}

export interface HassActionDetail {
  config: { entity?: string; tap_action: ActionConfig };
  action: "tap";
}

export interface LovelaceGridOptions {
  columns?: number | "full";
  rows?: number | "auto";
  min_columns?: number;
  max_columns?: number;
  min_rows?: number;
  max_rows?: number;
}

export interface LovelaceCardConfig {
  type: string;
  device_id?: string;
  title?: string;
  entities?: Partial<Record<string, string>>;
  [key: string]: unknown;
}
