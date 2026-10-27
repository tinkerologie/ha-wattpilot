import { css, html, nothing, type TemplateResult } from "lit";
import { pressButton } from "../actions";
import { WattpilotBaseCard } from "../base-card";
import {
  isAvailable,
  isPressable,
  numericAttribute,
  numericState,
  type Role,
} from "../entities";
import {
  PLACEHOLDER,
  distanceUnit,
  energyToDistance,
  energyWh,
  formatEnergy,
  formatNumber,
  formatPower,
  powerWatts,
  stateParts,
  type ValueParts,
} from "../format";
import { buildConfigForm } from "../form";
import {
  icon,
  mdiClose,
  mdiEvPlugType2,
  mdiHomeBatteryOutline,
  mdiInformationOutline,
  mdiPlay,
  mdiStop,
  mdiLightningBolt,
  mdiTransmissionTower,
  mdiWhiteBalanceSunny,
} from "../icons";
import type { TranslationKey } from "../localize";
import { registerCard } from "../register";
import { cardStyles } from "../styles";
import type { HassEntity, HomeAssistant, LovelaceCardConfig } from "../types";

export const CHARGER_CARD_TAG = "wattpilot-charger-card";

export interface ChargerCardConfig extends LovelaceCardConfig {
  consumption?: number;
  show_power_flow?: boolean;
  show_pv_settings?: boolean;
  show_force_start?: boolean;
  confirm_force_start?: boolean;
}

type Status = "no_car" | "charging" | "ready" | "complete" | "error" | "unavailable";
type Page = "overview" | "pv";

const NOMINAL_VOLTAGE = 230;
const DEFAULT_CONSUMPTION = 18;
const RING_RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const CAR_STATES: Record<string, Status> = {
  Idle: "no_car",
  Charging: "charging",
  "Wait Car": "ready",
  Complete: "complete",
  Error: "error",
};

const ROLES: readonly Role[] = [
  "car_state",
  "charging_power",
  "session_energy",
  "plug_connected",
  "charging",
  "start_charging",
  "stop_charging",
  "start_charging_force",
  "max_charging_current",
  "phases_in_use",
  "cable_current_limit",
  "pv_power",
  "grid_power",
  "battery_power",
  "battery_soc",
  "start_charging_at",
  "pv_battery_threshold",
];

export class WattpilotChargerCard extends WattpilotBaseCard<ChargerCardConfig> {
  static override styles = [
    cardStyles,
    css`
      .eyebrow {
        display: flex;
        align-items: center;
        gap: var(--ha-space-1, 4px);
        color: var(--wp-subtext);
        font-size: var(--ha-font-size-s, 12px);
        font-weight: var(--ha-font-weight-medium, 500);
        letter-spacing: 0.02em;
        margin-block-end: var(--ha-space-1, 4px);
      }
      .eyebrow .icon {
        --mdc-icon-size: 16px;
      }
      .flow {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--ha-space-2, 8px);
      }
      .flow-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--ha-space-2, 8px);
        padding-block: var(--ha-space-1, 4px);
        border-radius: var(--ha-border-radius-lg, 12px);
      }
      .flow-icon {
        display: grid;
        place-items: center;
        inline-size: 56px;
        block-size: 56px;
        border-radius: 50%;
        border: 1.5px solid var(--wp-divider);
        color: var(--wp-subtext);
      }
      .flow-item.solar .flow-icon.active {
        border-color: var(--wp-solar);
        color: var(--wp-solar);
      }
      .flow-item.battery .flow-icon.active {
        border-color: var(--wp-battery);
        color: var(--wp-battery);
      }
      .flow-item.grid .flow-icon.active {
        border-color: var(--wp-grid);
        color: var(--wp-grid);
      }
      .flow-value {
        color: var(--wp-subtext);
        font-size: var(--ha-font-size-m, 14px);
      }
      .hero {
        display: grid;
        justify-items: center;
      }
      .ring {
        position: relative;
        inline-size: min(180px, 60%);
        aspect-ratio: 1;
        border-radius: 50%;
      }
      .ring svg {
        inline-size: 100%;
        block-size: 100%;
        transform: rotate(-90deg);
      }
      .ring-track {
        stroke: var(--wp-surface);
      }
      .ring-progress {
        stroke: var(--wp-accent);
        transition: stroke-dashoffset var(--ha-animation-duration-slow, 400ms) ease;
      }
      .ring.idle .ring-progress {
        stroke: var(--wp-divider);
      }
      .ring-label {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--ha-space-1, 4px);
      }
      .ring-power {
        font-size: var(--ha-font-size-3xl, 28px);
        font-weight: var(--ha-font-weight-bold, 600);
        line-height: 1;
      }
      .ring-rate {
        color: var(--wp-subtext);
        font-size: var(--ha-font-size-m, 14px);
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--ha-space-2, 8px);
      }
      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--ha-space-1, 4px);
        padding-block: var(--ha-space-2, 8px);
        border-radius: var(--ha-border-radius-lg, 12px);
      }
      .stat-label {
        color: var(--wp-subtext);
        font-size: var(--ha-font-size-m, 14px);
      }
      .stat-value {
        font-size: var(--ha-font-size-xl, 20px);
        font-weight: var(--ha-font-weight-medium, 500);
      }
      .actions {
        display: flex;
        gap: var(--ha-space-2, 8px);
      }
      .actions .pill-button {
        flex: 1;
      }
      .pv-tile {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--ha-space-2, 8px) var(--ha-space-4, 16px);
        padding: var(--ha-space-4, 16px);
        border-radius: var(--ha-border-radius-lg, 12px);
        background: var(--wp-surface);
      }
      .pv-tile h3 {
        margin: 0;
        font-size: var(--ha-font-size-m, 14px);
        font-weight: var(--ha-font-weight-bold, 600);
      }
      .pv-value {
        justify-self: start;
        font-size: var(--ha-font-size-2xl, 24px);
        font-weight: var(--ha-font-weight-bold, 600);
      }
      .threshold {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--ha-space-1, 4px);
        grid-row: span 2;
      }
      .threshold .pill-button {
        min-inline-size: 120px;
        background: var(--ha-card-background, var(--card-background-color));
        font-weight: var(--ha-font-weight-bold, 600);
      }
      .threshold .icon.solar {
        color: var(--wp-solar);
      }
      .threshold .icon.battery {
        color: var(--wp-battery);
      }
      .threshold-caption {
        color: var(--wp-subtext);
        font-size: var(--ha-font-size-s, 12px);
      }
      .pages {
        display: flex;
        justify-content: center;
        gap: var(--ha-space-2, 8px);
      }
      .page-dot {
        display: grid;
        place-items: center;
        inline-size: 24px;
        block-size: 24px;
      }
      .page-dot::before {
        content: "";
        display: block;
        inline-size: 8px;
        block-size: 8px;
        border-radius: var(--ha-border-radius-pill, 9999px);
        background: var(--wp-divider);
        transition: inline-size var(--ha-animation-duration-fast, 150ms) ease;
      }
      .page-dot[aria-selected="true"]::before {
        inline-size: 20px;
        background: var(--wp-text);
      }
      .info {
        display: grid;
        gap: var(--ha-space-3, 12px);
        margin: 0;
        padding: var(--ha-space-4, 16px);
        border-radius: var(--ha-border-radius-lg, 12px);
        background: var(--wp-surface);
      }
      .info-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .info dl {
        margin: 0;
        display: grid;
        gap: var(--ha-space-3, 12px);
      }
      .info dt {
        color: var(--wp-subtext);
        font-size: var(--ha-font-size-s, 12px);
      }
      .info dd {
        margin: var(--ha-space-1, 4px) 0 0;
        display: flex;
        align-items: center;
        gap: var(--ha-space-2, 8px);
        font-weight: var(--ha-font-weight-medium, 500);
      }
    `,
  ];

  static override properties = {
    ...WattpilotBaseCard.properties,
    _page: { state: true },
    _showInfo: { state: true },
  };

  declare _page: Page;
  declare _showInfo: boolean;
  private _swipeStart?: number;

  protected readonly roles = ROLES;

  constructor() {
    super();
    this._page = "overview";
    this._showInfo = false;
  }

  static getConfigForm() {
    return buildConfigForm({
      consumption: true,
      toggles: [
        { name: "show_power_flow", default: true },
        { name: "show_pv_settings", default: true },
        { name: "show_force_start", default: false },
        { name: "confirm_force_start", default: true },
      ],
      roles: ROLES,
    });
  }

  override getCardSize(): number {
    return 9;
  }

  private get consumption(): number {
    const value = Number(this.config.consumption);
    return value > 0 ? value : DEFAULT_CONSUMPTION;
  }

  private get status(): Status {
    const carState = this.entity("car_state");
    if (isAvailable(carState)) return CAR_STATES[carState.state] ?? "no_car";
    const charging = this.entity("charging");
    const plug = this.entity("plug_connected");
    if (!isAvailable(charging) && !isAvailable(plug)) return "unavailable";
    if (charging?.state === "on") return "charging";
    return plug?.state === "on" ? "ready" : "no_car";
  }

  /** Maximum charging power from the current limit and the phases in use. */
  private get maxPower(): number | undefined {
    const amps = numericState(this.entity("max_charging_current"));
    if (amps === undefined) return undefined;
    const phases = numericState(this.entity("phases_in_use")) ?? 3;
    return amps * NOMINAL_VOLTAGE * Math.max(1, Math.min(3, phases));
  }

  protected override render(): TemplateResult {
    if (!this.hass) return html``;
    if (this.missingDevice) return this.renderMissingDevice();

    const status = this.status;
    const showPv = this.config.show_pv_settings !== false && this.hasPvSettings;
    const page: Page = showPv ? this._page : "overview";

    return html`<ha-card
      @pointerdown=${showPv ? this._onPointerDown : nothing}
      @pointerup=${showPv ? this._onPointerUp : nothing}
    >
      <div class="header">
        <div>
          ${this.deviceTitle
            ? html`<div class="eyebrow">${icon(mdiEvPlugType2)}<span>${this.deviceTitle}</span></div>`
            : nothing}
          <h2 class="title">
            ${page === "pv"
              ? this.t("label.pv_quick_settings")
              : this.t(`status.${status}.title` as TranslationKey)}
          </h2>
          ${page === "overview"
            ? html`<p class="subtitle">
                ${this.t(`status.${status}.subtitle` as TranslationKey)}
              </p>`
            : nothing}
        </div>
        <button
          type="button"
          class="icon-button"
          aria-label=${this.t("label.show_information")}
          aria-expanded=${this._showInfo ? "true" : "false"}
          aria-controls="info"
          @click=${() => (this._showInfo = !this._showInfo)}
        >
          ${icon(this._showInfo ? mdiClose : mdiInformationOutline)}
        </button>
      </div>

      ${this._showInfo ? this.renderInfo() : nothing}

      <div
        id="panel"
        role=${showPv ? "tabpanel" : nothing}
        aria-label=${page === "pv" ? this.t("label.pv_quick_settings") : this.t("label.overview")}
      >
        ${page === "pv" ? this.renderPvSettings() : this.renderOverview(status)}
      </div>

      ${showPv ? this.renderPager(page) : nothing}
    </ha-card>`;
  }

  private renderOverview(status: Status): TemplateResult {
    const power = powerWatts(this.entity("charging_power"));
    const maxPower = this.maxPower;
    const fraction =
      status === "charging" && power !== undefined && maxPower
        ? Math.max(0.02, Math.min(1, power / maxPower))
        : 0;
    const powerParts = formatPower(this.hass, power);
    const sessionEnergy = this.entity("session_energy");
    const wh = energyWh(sessionEnergy);
    const unit = distanceUnit(this.hass);
    const distance = energyToDistance(this.hass, wh, this.consumption);
    const rate = energyToDistance(
      this.hass,
      status === "charging" ? power : undefined,
      this.consumption
    );

    return html`<div class="stack">
      ${this.config.show_power_flow !== false ? this.renderPowerFlow() : nothing}
      <div class="hero">
        <div
          class="ring ${status === "charging" ? "" : "idle"}"
          role="img"
          aria-label="${this.t("label.charging_power")}: ${powerParts.value} ${powerParts.unit}"
        >
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle class="ring-track" cx="60" cy="60" r=${RING_RADIUS} fill="none" stroke-width="8"></circle>
            <circle
              class="ring-progress"
              cx="60"
              cy="60"
              r=${RING_RADIUS}
              fill="none"
              stroke-width="8"
              stroke-linecap="round"
              stroke-dasharray=${RING_LENGTH}
              stroke-dashoffset=${RING_LENGTH * (1 - (fraction || 1))}
            ></circle>
          </svg>
          <div class="ring-label">
            <span class="ring-power value">${this.renderParts(powerParts)}</span>
            <span class="ring-rate">
              ${this.t("label.per_hour", {
                value: `${rate === undefined ? PLACEHOLDER : formatNumber(this.hass, rate)} ${unit}`,
              })}
            </span>
          </div>
        </div>
      </div>
      <div class="stats">
        <button
          type="button"
          class="stat"
          ?disabled=${!sessionEnergy}
          @click=${() => this.moreInfo(sessionEnergy)}
        >
          <span class="stat-label">${this.t("label.distance")}</span>
          <span class="stat-value value">
            ${this.renderParts({
              value: distance === undefined ? PLACEHOLDER : formatNumber(this.hass, distance),
              unit,
            })}
          </span>
        </button>
        <button
          type="button"
          class="stat"
          ?disabled=${!sessionEnergy}
          @click=${() => this.moreInfo(sessionEnergy)}
        >
          <span class="stat-label">${this.t("label.energy")}</span>
          <span class="stat-value value">${this.renderParts(formatEnergy(this.hass, wh))}</span>
        </button>
      </div>
      ${this.renderActions(status)}
    </div>`;
  }

  private renderPowerFlow(): TemplateResult | typeof nothing {
    const items = [
      { role: "battery_power", kind: "battery", path: mdiHomeBatteryOutline, label: "label.battery" },
      { role: "pv_power", kind: "solar", path: mdiWhiteBalanceSunny, label: "label.solar" },
      { role: "grid_power", kind: "grid", path: mdiTransmissionTower, label: "label.grid" },
    ] as const;
    const resolved = items.map((item) => ({ ...item, entity: this.entity(item.role) }));
    if (!resolved.some((item) => item.entity)) return nothing;
    return html`<div class="flow">
      ${resolved.map(({ entity, kind, path, label }) => {
        const watts = powerWatts(entity);
        const parts = formatPower(this.hass, watts);
        return html`<button
          type="button"
          class="flow-item ${kind}"
          ?disabled=${!entity}
          aria-label="${this.t(label)}: ${parts.value} ${parts.unit}"
          @click=${() => this.moreInfo(entity)}
        >
          <span class="flow-icon ${watts ? "active" : ""}">${icon(path)}</span>
          <span class="flow-value value">${parts.value} ${parts.unit}</span>
        </button>`;
      })}
    </div>`;
  }

  private renderActions(status: Status): TemplateResult | typeof nothing {
    const charging = status === "charging";
    const button = this.entity(charging ? "stop_charging" : "start_charging");
    const force = this.entity("start_charging_force");
    const showForce = this.config.show_force_start === true && force && !charging;
    if (!button && !showForce) return nothing;
    const canAct = isAvailable(this.entity("car_state")) || isAvailable(this.entity("plug_connected"));
    const enabled = isPressable(button) && canAct && status !== "no_car" && status !== "unavailable";
    return html`<div class="actions">
      ${button
        ? html`<button
            type="button"
            class="pill-button ${enabled ? "filled" : "tonal"}"
            ?disabled=${!enabled}
            @click=${() => this.hass && pressButton(this, this.hass, button.entity_id)}
          >
            ${icon(charging ? mdiStop : mdiPlay)}
            <span>${this.t(charging ? "label.stop" : "label.start")}</span>
          </button>`
        : nothing}
      ${showForce
        ? html`<button
            type="button"
            class="pill-button tonal"
            ?disabled=${!isPressable(force) || status === "no_car"}
            @click=${() =>
              this.hass &&
              pressButton(
                this,
                this.hass,
                force.entity_id,
                this.config.confirm_force_start === false
                  ? undefined
                  : this.t("label.confirm_force_start")
              )}
          >
            ${icon(mdiLightningBolt)}<span>${this.t("label.force_start")}</span>
          </button>`
        : nothing}
    </div>`;
  }

  private get hasPvSettings(): boolean {
    return (
      this.entity("start_charging_at") !== undefined ||
      this.entity("pv_battery_threshold") !== undefined
    );
  }

  /** Surplus available to the car: export plus what the car already draws. */
  private get pvSurplus(): number | undefined {
    const grid = powerWatts(this.entity("grid_power"));
    if (grid === undefined) return undefined;
    const charging = powerWatts(this.entity("charging_power")) ?? 0;
    return Math.max(0, charging - grid);
  }

  private renderPvSettings(): TemplateResult {
    const startAt = this.entity("start_charging_at");
    const threshold = this.entity("pv_battery_threshold");
    const soc = this.entity("battery_soc");
    return html`<div class="stack tight">
      ${startAt
        ? this.renderPvTile(
            this.t("label.pv_surplus"),
            formatPower(this.hass, this.pvSurplus),
            this.entity("grid_power"),
            startAt,
            formatPower(this.hass, powerWatts(startAt)),
            mdiWhiteBalanceSunny,
            "solar"
          )
        : nothing}
      ${threshold
        ? this.renderPvTile(
            this.t("label.pv_battery_soc"),
            stateParts(this.hass, soc),
            soc,
            threshold,
            stateParts(this.hass, threshold),
            mdiHomeBatteryOutline,
            "battery"
          )
        : nothing}
    </div>`;
  }

  private renderPvTile(
    title: string,
    current: ValueParts,
    currentEntity: HassEntity | undefined,
    thresholdEntity: HassEntity,
    threshold: ValueParts,
    path: string,
    kind: "solar" | "battery"
  ): TemplateResult {
    return html`<section class="pv-tile" aria-label=${title}>
      <h3>${title}</h3>
      <div class="threshold">
        <button
          type="button"
          class="pill-button outlined"
          aria-label="${this.t("label.charge_above")} ${threshold.value} ${threshold.unit}"
          @click=${() => this.moreInfo(thresholdEntity)}
        >
          ${icon(path, `icon ${kind}`)}
          <span class="value">${this.renderParts(threshold)}</span>
        </button>
        <span class="threshold-caption">${this.t("label.charge_above")}</span>
      </div>
      <button
        type="button"
        class="pv-value value"
        ?disabled=${!currentEntity}
        @click=${() => this.moreInfo(currentEntity)}
      >
        ${this.renderParts(current)}
      </button>
    </section>`;
  }

  private renderPager(page: Page): TemplateResult {
    const pages: [Page, TranslationKey][] = [
      ["overview", "label.overview"],
      ["pv", "label.pv_quick_settings"],
    ];
    return html`<div class="pages" role="tablist" @keydown=${this._onPagerKeydown}>
      ${pages.map(
        ([id, label]) => html`<button
          type="button"
          role="tab"
          class="page-dot"
          aria-controls="panel"
          aria-selected=${page === id ? "true" : "false"}
          aria-label=${this.t(label)}
          tabindex=${page === id ? 0 : -1}
          @click=${() => (this._page = id)}
        ></button>`
      )}
    </div>`;
  }

  private renderInfo(): TemplateResult {
    const power = this.entity("charging_power");
    const phases = numericState(this.entity("phases_in_use"));
    const lines = Math.max(1, Math.min(3, phases ?? 3));
    const perPhase = (suffix: string, unit: string): string => {
      const values = [1, 2, 3]
        .slice(0, lines)
        .map((line) => numericAttribute(power, `L${line}_${suffix}`))
        .map((value) => (value === undefined ? PLACEHOLDER : formatNumber(this.hass, value)));
      return `${lines}~ (${values.join(" / ")} ${unit})`;
    };
    const cable = this.entity("cable_current_limit");
    return html`<section id="info" class="info" aria-label=${this.t("label.information")}>
      <div class="info-header">
        <h3 class="section-title">${this.t("label.information")}</h3>
      </div>
      <dl>
        <div><dt>${this.t("label.current")}</dt><dd class="value">${perPhase("Ampere", "A")}</dd></div>
        <div><dt>${this.t("label.voltage")}</dt><dd class="value">${perPhase("Voltage", "V")}</dd></div>
        <div>
          <dt>${this.t("label.power_factor")}</dt>
          <dd class="value">${perPhase("PowerRelative", "%")}</dd>
        </div>
        <div>
          <dt>${this.t("label.charging_plug")}</dt>
          <dd>
            ${icon(mdiEvPlugType2)}
            <span>${this.t("label.type2")}</span>
            ${isAvailable(cable)
              ? html`<span class="value">${this.renderParts(stateParts(this.hass, cable))}</span>`
              : nothing}
          </dd>
        </div>
      </dl>
    </section>`;
  }

  private renderParts(parts: ValueParts): TemplateResult {
    return html`${parts.value}${parts.unit ? html`<span class="unit">${parts.unit}</span>` : nothing}`;
  }

  private _onPagerKeydown = (event: KeyboardEvent): void => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const rtl = getComputedStyle(this).direction === "rtl";
    const forward = event.key === "End" || (event.key === "ArrowRight") !== rtl;
    this._page = event.key === "Home" ? "overview" : forward ? "pv" : "overview";
    void this.updateComplete.then(() =>
      this.renderRoot.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')?.focus()
    );
  };

  private _onPointerDown = (event: PointerEvent): void => {
    this._swipeStart = event.pointerType === "mouse" ? undefined : event.clientX;
  };

  private _onPointerUp = (event: PointerEvent): void => {
    if (this._swipeStart === undefined) return;
    const delta = event.clientX - this._swipeStart;
    this._swipeStart = undefined;
    if (Math.abs(delta) < 50) return;
    const rtl = getComputedStyle(this).direction === "rtl";
    this._page = (delta < 0) !== rtl ? "pv" : "overview";
  };
}

registerCard(
  CHARGER_CARD_TAG,
  WattpilotChargerCard,
  "card.charger.name",
  "card.charger.description",
  (hass: HomeAssistant, entityId: string) => {
    const entry = hass.entities?.[entityId];
    return (
      entry?.platform === "wattpilot" &&
      (entry.translation_key === "car_state" || entry.translation_key === "charging_power")
    )
      ? { config: { type: `custom:${CHARGER_CARD_TAG}`, device_id: entry.device_id ?? undefined } }
      : null;
  }
);
