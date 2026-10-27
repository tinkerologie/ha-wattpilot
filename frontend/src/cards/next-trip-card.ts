import { css, html, nothing, type TemplateResult } from "lit";
import { selectOption, setNumber, setSwitch, setTime } from "../actions";
import { WattpilotBaseCard } from "../base-card";
import { isAvailable, numericAttribute, numericState, type Role } from "../entities";
import { buildConfigForm } from "../form";
import { icon, mdiCarClock, mdiInformationOutline } from "../icons";
import { registerCard } from "../register";
import { cardStyles } from "../styles";
import type { HassEntity, LovelaceCardConfig, LovelaceGridOptions } from "../types";

export const NEXT_TRIP_CARD_TAG = "wattpilot-next-trip-card";
const NEXT_TRIP_MODE = "Next Trip";

export interface NextTripCardConfig extends LovelaceCardConfig {
  show_remain_in_eco?: boolean;
}

const ROLES: readonly Role[] = [
  "next_trip_time",
  "next_trip_charging",
  "remain_in_eco_mode",
  "charging_mode",
];

/** The trip energy entity reports Wh; edit it in kWh like the Wattpilot app. */
function energyScale(entity: HassEntity | undefined): number {
  return entity?.attributes.unit_of_measurement === "Wh" ? 1000 : 1;
}

export class WattpilotNextTripCard extends WattpilotBaseCard<NextTripCardConfig> {
  static override styles = [
    cardStyles,
    css`
      .header {
        align-items: center;
        justify-content: flex-start;
      }
      .header .icon {
        color: var(--wp-accent);
      }
      .field {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--ha-space-3, 12px);
        min-block-size: 48px;
      }
      input[type="time"],
      input[type="number"] {
        font: inherit;
        font-size: var(--ha-font-size-l, 16px);
        font-variant-numeric: tabular-nums;
        color: var(--wp-text);
        background: var(--wp-surface);
        border: 1px solid var(--wp-divider);
        border-radius: var(--ha-border-radius-md, 8px);
        padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
        min-block-size: 40px;
        box-sizing: border-box;
      }
      input[type="number"] {
        inline-size: 7em;
        text-align: end;
      }
      .number {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2, 8px);
      }
      input[type="checkbox"][role="switch"] {
        inline-size: 20px;
        block-size: 20px;
        accent-color: var(--wp-accent);
      }
      .hint {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
        padding: var(--ha-space-3, 12px);
        border-radius: var(--ha-border-radius-lg, 12px);
        background: var(--wp-surface);
        color: var(--wp-subtext);
        margin: 0;
      }
      .hint .grow {
        flex: 1;
        min-inline-size: 12em;
      }
      .hint .pill-button {
        min-block-size: 40px;
        background: var(--ha-card-background, var(--card-background-color));
        font-size: var(--ha-font-size-m, 14px);
      }
    `,
  ];

  protected readonly roles = ROLES;

  static getConfigForm() {
    return buildConfigForm({
      toggles: [{ name: "show_remain_in_eco", default: true }],
      roles: ROLES,
    });
  }

  override getCardSize(): number {
    return 4;
  }

  override getGridOptions(): LovelaceGridOptions {
    return { columns: 12, rows: "auto", min_columns: 6 };
  }

  protected override render(): TemplateResult {
    if (!this.hass) return html``;
    if (this.missingDevice) return this.renderMissingDevice();
    const time = this.entity("next_trip_time");
    const energy = this.entity("next_trip_charging");
    const eco = this.entity("remain_in_eco_mode");
    const mode = this.entity("charging_mode");
    const inactive = isAvailable(mode) && mode.state !== NEXT_TRIP_MODE;

    return html`<ha-card>
      <div class="header">
        ${icon(mdiCarClock)}
        <h2 class="section-title">
          ${this.config.title || this.t("label.mode.Next Trip")}
        </h2>
      </div>
      ${inactive ? this.renderInactiveHint(mode) : nothing}
      ${time ? this.renderTime(time) : nothing}
      ${energy ? this.renderEnergy(energy) : nothing}
      ${eco && this.config.show_remain_in_eco !== false ? this.renderEco(eco) : nothing}
    </ha-card>`;
  }

  private renderInactiveHint(mode: HassEntity): TemplateResult {
    const options = mode.attributes.options;
    const canSwitch = Array.isArray(options) && options.includes(NEXT_TRIP_MODE);
    return html`<p class="hint" role="status">
      ${icon(mdiInformationOutline)}
      <span class="grow">${this.t("label.next_trip_inactive")}</span>
      ${canSwitch
        ? html`<button
            type="button"
            class="pill-button outlined"
            @click=${() => this.hass && selectOption(this.hass, mode.entity_id, NEXT_TRIP_MODE)}
          >
            ${this.t("label.activate_next_trip")}
          </button>`
        : nothing}
    </p>`;
  }

  private renderTime(time: HassEntity): TemplateResult {
    const value = isAvailable(time) ? time.state.slice(0, 5) : "";
    return html`<label class="field">
      <span>${this.t("label.departure")}</span>
      <input
        type="time"
        .value=${value}
        ?disabled=${!isAvailable(time)}
        @change=${(event: Event) => {
          const next = (event.target as HTMLInputElement).value;
          if (this.hass && /^\d{2}:\d{2}$/.test(next)) {
            void setTime(this.hass, time.entity_id, `${next}:00`);
          }
        }}
      />
    </label>`;
  }

  private renderEnergy(energy: HassEntity): TemplateResult {
    const scale = energyScale(energy);
    const unit = scale === 1000 ? "kWh" : String(energy.attributes.unit_of_measurement ?? "");
    const raw = numericState(energy);
    const min = (numericAttribute(energy, "min") ?? 0) / scale;
    const max = (numericAttribute(energy, "max") ?? Number.MAX_SAFE_INTEGER) / scale;
    return html`<label class="field">
      <span>${this.t("label.trip_energy")}</span>
      <span class="number">
        <input
          type="number"
          inputmode="decimal"
          min=${min}
          max=${max}
          step=${scale === 1000 ? 0.5 : (numericAttribute(energy, "step") ?? 1)}
          .value=${raw === undefined ? "" : String(raw / scale)}
          ?disabled=${!isAvailable(energy)}
          @change=${(event: Event) => {
            const input = event.target as HTMLInputElement;
            const value = Number(input.value);
            if (!this.hass || input.value === "" || !Number.isFinite(value)) return;
            const clamped = Math.min(max, Math.max(min, value));
            void setNumber(this.hass, energy.entity_id, Math.round(clamped * scale));
          }}
        />
        <span class="unit">${unit}</span>
      </span>
    </label>`;
  }

  private renderEco(eco: HassEntity): TemplateResult {
    const on = eco.state === "on";
    return html`<label class="field">
      <span>${this.t("label.remain_in_eco")}</span>
      <input
        type="checkbox"
        role="switch"
        .checked=${on}
        ?disabled=${!isAvailable(eco)}
        @change=${(event: Event) =>
          this.hass &&
          setSwitch(this.hass, eco.entity_id, (event.target as HTMLInputElement).checked)}
      />
    </label>`;
  }
}

registerCard(
  NEXT_TRIP_CARD_TAG,
  WattpilotNextTripCard,
  "card.next_trip.name",
  "card.next_trip.description"
);
