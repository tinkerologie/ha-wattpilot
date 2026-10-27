import { css, html, nothing, type TemplateResult } from "lit";
import { selectOption, setSwitch } from "../actions";
import { WattpilotBaseCard } from "../base-card";
import { isAvailable, type Role } from "../entities";
import { stateParts } from "../format";
import { buildConfigForm } from "../form";
import {
  icon,
  mdiCarClock,
  mdiChevronRight,
  mdiCogOutline,
  mdiHomeBatteryOutline,
  mdiInformationOutline,
  mdiLeaf,
  mdiLightningBolt,
  mdiStop,
} from "../icons";
import { localizeOptional } from "../localize";
import { registerCard } from "../register";
import { cardStyles } from "../styles";
import type { LovelaceCardConfig, LovelaceGridOptions } from "../types";

export const MODE_CARD_TAG = "wattpilot-mode-card";

export interface ModeCardConfig extends LovelaceCardConfig {
  show_pv_battery?: boolean;
  show_charging_speed?: boolean;
  show_phase_mode?: boolean;
}

const MODE_ICONS: Record<string, string> = {
  Default: mdiLightningBolt,
  Eco: mdiLeaf,
  "Next Trip": mdiCarClock,
};

const ROLES: readonly Role[] = [
  "charging_mode",
  "discharge_pv_battery",
  "pv_battery_discharges_until",
  "max_charging_current",
  "phase_switch",
];

export class WattpilotModeCard extends WattpilotBaseCard<ModeCardConfig> {
  static override styles = [
    cardStyles,
    css`
      .modes {
        display: grid;
        grid-template-columns: repeat(var(--mode-count, 3), minmax(0, 1fr));
        grid-template-rows: auto auto;
        column-gap: var(--ha-space-2, 8px);
      }
      .mode {
        /* Subgrid keeps the icons aligned when a translated label wraps. */
        display: grid;
        grid-row: span 2;
        grid-template-rows: subgrid;
        justify-items: center;
        align-items: end;
        row-gap: var(--ha-space-3, 12px);
        padding-block: var(--ha-space-2, 8px);
        border-radius: var(--ha-border-radius-lg, 12px);
      }
      .mode-label {
        text-align: center;
        font-size: var(--ha-font-size-l, 16px);
        font-weight: var(--ha-font-weight-bold, 600);
      }
      .mode-icon {
        display: grid;
        place-items: center;
        inline-size: 64px;
        block-size: 64px;
        border-radius: 50%;
        background: var(--wp-surface);
        box-shadow: var(--ha-box-shadow-s, none);
        transition:
          background-color var(--ha-animation-duration-fast, 150ms) ease,
          color var(--ha-animation-duration-fast, 150ms) ease;
      }
      .mode-icon .icon {
        --mdc-icon-size: 28px;
      }
      .mode[aria-checked="true"] .mode-icon {
        background: var(--wp-accent);
        color: var(--wp-on-accent);
      }
      .mode:focus-visible {
        outline: none;
      }
      .mode:focus-visible .mode-icon {
        outline: 2px solid var(--wp-focus);
        outline-offset: 3px;
      }
      .mode-hint {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--ha-space-1, 4px);
        margin: 0;
        color: var(--wp-text);
      }
      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .battery-actions {
        display: flex;
        align-items: center;
        gap: var(--ha-space-3, 12px);
      }
      .battery-actions .pill-button {
        flex: 1;
      }
      .battery-actions .icon.battery {
        color: var(--wp-battery);
      }
      .settings-button {
        inline-size: 48px;
        block-size: 48px;
        border: 1px solid var(--wp-divider);
        color: var(--wp-text);
      }
      select {
        font: inherit;
        color: var(--wp-text);
        background: var(--wp-surface);
        border: 1px solid var(--wp-divider);
        border-radius: var(--ha-border-radius-md, 8px);
        padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
        min-block-size: 40px;
      }
    `,
  ];

  protected readonly roles = ROLES;

  static getConfigForm() {
    return buildConfigForm({
      toggles: [
        { name: "show_pv_battery", default: true },
        { name: "show_charging_speed", default: true },
        { name: "show_phase_mode", default: false },
      ],
      roles: ROLES,
    });
  }

  override getCardSize(): number {
    return 6;
  }

  override getGridOptions(): LovelaceGridOptions {
    return { columns: 12, rows: "auto", min_columns: 6 };
  }

  protected override render(): TemplateResult {
    if (!this.hass) return html``;
    if (this.missingDevice) return this.renderMissingDevice();
    const sections = [
      this.renderModes(),
      this.config.show_pv_battery !== false ? this.renderPvBattery() : nothing,
      this.config.show_charging_speed !== false ? this.renderChargingSpeed() : nothing,
      this.config.show_phase_mode === true ? this.renderPhaseMode() : nothing,
    ].filter((section) => section !== nothing);
    return html`<ha-card>
      ${this.config.title ? html`<h2 class="section-title">${this.config.title}</h2>` : nothing}
      ${sections.map(
        (section, index) => html`${index > 0 ? html`<hr class="divider" />` : nothing}${section}`
      )}
    </ha-card>`;
  }

  private renderModes(): TemplateResult | typeof nothing {
    const select = this.entity("charging_mode");
    if (!select) return nothing;
    const raw = select.attributes.options;
    const options = Array.isArray(raw) ? raw.map(String) : [];
    const available = isAvailable(select);
    const current = select.state;
    return html`<div class="stack tight">
      <div
        class="modes"
        role="radiogroup"
        aria-label=${this.t("label.charging_mode")}
        style="--mode-count: ${Math.max(1, options.length)}"
        @keydown=${(event: KeyboardEvent) => this._onModeKeydown(event, options, current)}
      >
        ${options.map((option) => {
          const checked = option === current;
          return html`<button
            type="button"
            role="radio"
            class="mode"
            aria-checked=${checked ? "true" : "false"}
            tabindex=${checked || (!options.includes(current) && option === options[0]) ? 0 : -1}
            ?disabled=${!available}
            @click=${() => this._selectMode(option)}
          >
            <span class="mode-label">${localizeOptional(this.hass, `label.mode.${option}`, option)}</span>
            <span class="mode-icon">${icon(MODE_ICONS[option] ?? mdiLightningBolt)}</span>
          </button>`;
        })}
      </div>
      <p class="mode-hint">
        <span>${localizeOptional(this.hass, `label.mode_hint.${current}`, this.hass?.formatEntityState?.(select) ?? current)}</span>
        <button
          type="button"
          class="icon-button"
          aria-label=${this.t("label.mode_details")}
          @click=${() => this.moreInfo(select)}
        >
          ${icon(mdiInformationOutline)}
        </button>
      </p>
    </div>`;
  }

  private renderPvBattery(): TemplateResult | typeof nothing {
    const toggle = this.entity("discharge_pv_battery");
    if (!toggle) return nothing;
    const on = toggle.state === "on";
    const settings = this.entity("pv_battery_discharges_until");
    return html`<section class="stack tight" aria-labelledby="pv-battery-title">
      <div class="section-header">
        <h3 id="pv-battery-title" class="section-title">${this.t("label.charging_from_pv_battery")}</h3>
        <button
          type="button"
          class="icon-button"
          aria-label="${this.t("label.charging_from_pv_battery")}: ${this.t("label.information")}"
          @click=${() => this.moreInfo(toggle)}
        >
          ${icon(mdiInformationOutline)}
        </button>
      </div>
      <div class="battery-actions">
        <button
          type="button"
          class="pill-button ${on ? "filled" : "outlined"}"
          aria-pressed=${on ? "true" : "false"}
          ?disabled=${!isAvailable(toggle)}
          @click=${() => this.hass && setSwitch(this.hass, toggle.entity_id, !on)}
        >
          ${icon(on ? mdiStop : mdiHomeBatteryOutline, on ? "icon" : "icon battery")}
          <span>${this.t(on ? "label.stop" : "label.start")}</span>
        </button>
        ${settings
          ? html`<button
              type="button"
              class="icon-button settings-button"
              aria-label=${this.t("label.pv_battery_settings")}
              @click=${() => this.moreInfo(settings)}
            >
              ${icon(mdiCogOutline)}
            </button>`
          : nothing}
      </div>
    </section>`;
  }

  private renderChargingSpeed(): TemplateResult | typeof nothing {
    const current = this.entity("max_charging_current");
    if (!current) return nothing;
    const parts = stateParts(this.hass, current);
    return html`<button
      type="button"
      class="row row-button"
      @click=${() => this.moreInfo(current)}
    >
      <span class="grow">${this.t("label.charging_speed")}</span>
      <span class="row-value">${parts.value} ${parts.unit}</span>
      ${icon(mdiChevronRight)}
    </button>`;
  }

  private renderPhaseMode(): TemplateResult | typeof nothing {
    const select = this.entity("phase_switch");
    if (!select) return nothing;
    const raw = select.attributes.options;
    const options = Array.isArray(raw) ? raw.map(String) : [];
    return html`<label class="row">
      <span class="grow">${this.t("label.phase_mode")}</span>
      <select
        .value=${select.state}
        ?disabled=${!isAvailable(select)}
        @change=${(event: Event) =>
          this.hass &&
          selectOption(this.hass, select.entity_id, (event.target as HTMLSelectElement).value)}
      >
        ${options.map(
          (option) =>
            html`<option value=${option} ?selected=${option === select.state}>
              ${this.hass?.formatEntityState?.(select, option) ?? option}
            </option>`
        )}
      </select>
    </label>`;
  }

  private _selectMode(option: string): void {
    const select = this.entity("charging_mode");
    if (!this.hass || !select || select.state === option) return;
    void selectOption(this.hass, select.entity_id, option);
  }

  private _onModeKeydown(event: KeyboardEvent, options: string[], current: string): void {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const rtl = getComputedStyle(this).direction === "rtl";
    const index = Math.max(0, options.indexOf(current));
    const forward =
      event.key === "ArrowDown" ||
      (event.key === "ArrowRight" && !rtl) ||
      (event.key === "ArrowLeft" && rtl);
    const step = forward ? 1 : -1;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? options.length - 1
          : (index + step + options.length) % options.length;
    const option = options[next];
    if (option === undefined) return;
    this._selectMode(option);
    const buttons = this.renderRoot.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons[next]?.focus();
  }
}

registerCard(MODE_CARD_TAG, WattpilotModeCard, "card.mode.name", "card.mode.description");
