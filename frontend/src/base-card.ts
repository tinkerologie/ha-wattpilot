import {
  LitElement,
  html,
  type CSSResultGroup,
  type PropertyValues,
  type TemplateResult,
} from "lit";
import { openMoreInfo } from "./actions";
import {
  deviceName,
  resolveEntity,
  resolveEntityId,
  wattpilotDevices,
  type Role,
} from "./entities";
import { icon, mdiAlertCircleOutline } from "./icons";
import { localize, type TranslationKey } from "./localize";
import { cardStyles } from "./styles";
import type {
  HassEntity,
  HomeAssistant,
  LovelaceCardConfig,
  LovelaceGridOptions,
} from "./types";

export abstract class WattpilotBaseCard<
  C extends LovelaceCardConfig = LovelaceCardConfig,
> extends LitElement {
  static override styles: CSSResultGroup = cardStyles;

  static override properties = {
    hass: { attribute: false },
    config: { state: true },
  };

  declare hass?: HomeAssistant;
  declare config: C;

  /** Roles whose entity states drive this card's rendering. */
  protected abstract readonly roles: readonly Role[];

  /** Shared stub: the first Wattpilot charger, without a `type` key. */
  static getStubConfig(hass: HomeAssistant): Partial<LovelaceCardConfig> {
    const device = wattpilotDevices(hass)[0];
    return device ? { device_id: device.id } : {};
  }

  setConfig(config: C): void {
    if (!config || typeof config !== "object") {
      throw new Error("Invalid configuration");
    }
    if (config.entities !== undefined && typeof config.entities !== "object") {
      throw new Error("'entities' must be a mapping of role to entity id");
    }
    this.config = { ...config };
  }

  getCardSize(): number {
    return 4;
  }

  getGridOptions(): LovelaceGridOptions {
    return { columns: 12, rows: "auto", min_columns: 6 };
  }

  protected override shouldUpdate(changed: PropertyValues<this>): boolean {
    if (changed.has("config") || !changed.has("hass")) return true;
    const oldHass = changed.get("hass") as HomeAssistant | undefined;
    const hass = this.hass;
    if (!oldHass || !hass) return true;
    if (
      oldHass.entities !== hass.entities ||
      oldHass.devices !== hass.devices ||
      oldHass.locale !== hass.locale
    ) {
      return true;
    }
    return this.roles.some((role) => {
      const entityId = resolveEntityId(hass, this.config, role);
      return entityId !== undefined && oldHass.states[entityId] !== hass.states[entityId];
    });
  }

  protected entity(role: Role): HassEntity | undefined {
    return this.hass ? resolveEntity(this.hass, this.config, role) : undefined;
  }

  protected t(key: TranslationKey, replacements?: Record<string, string>): string {
    return localize(this.hass, key, replacements);
  }

  protected get deviceTitle(): string | undefined {
    if (this.config.title) return this.config.title;
    const id = this.config.device_id;
    return id ? deviceName(this.hass?.devices?.[id]) : undefined;
  }

  /** True when no charger is configured or the configured one has no entities. */
  protected get missingDevice(): boolean {
    return !this.roles.some((role) => this.entity(role) !== undefined);
  }

  protected moreInfo(entity: HassEntity | undefined): void {
    if (entity) openMoreInfo(this, entity.entity_id);
  }

  protected renderMissingDevice(): TemplateResult {
    return html`<ha-card>
      <p class="warning" role="alert">
        ${icon(mdiAlertCircleOutline)}<span>${this.t("error.no_device")}</span>
      </p>
    </ha-card>`;
  }
}
