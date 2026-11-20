import { css, html, nothing, type TemplateResult } from "lit";
import { selectOption, setTime } from "../actions";
import { WattpilotBaseCard } from "../base-card";
import { DOMAIN, isAvailable, type Role } from "../entities";
import { buildConfigForm } from "../form";
import { icon, mdiCalendarClock, mdiContentCopy } from "../icons";
import { localizeOptional, type TranslationKey } from "../localize";
import { registerCard } from "../register";
import { cardStyles } from "../styles";
import type {
  HassEntity,
  HomeAssistant,
  LovelaceCardConfig,
  LovelaceGridOptions,
} from "../types";

export const SCHEDULE_CARD_TAG = "wattpilot-schedule-card";

export interface ScheduleCardConfig extends LovelaceCardConfig {
  show_slot_2?: boolean;
}

interface DayGroupDef {
  id: "weekday" | "saturday" | "sunday";
  labelKey: TranslationKey;
  controlRole: Role;
  start1Role: Role;
  end1Role: Role;
  start2Role: Role;
  end2Role: Role;
}

const DAY_GROUPS: readonly DayGroupDef[] = [
  {
    id: "weekday",
    labelKey: "label.schedule.weekday",
    controlRole: "schedule_weekday_control",
    start1Role: "schedule_weekday_start_1",
    end1Role: "schedule_weekday_end_1",
    start2Role: "schedule_weekday_start_2",
    end2Role: "schedule_weekday_end_2",
  },
  {
    id: "saturday",
    labelKey: "label.schedule.saturday",
    controlRole: "schedule_saturday_control",
    start1Role: "schedule_saturday_start_1",
    end1Role: "schedule_saturday_end_1",
    start2Role: "schedule_saturday_start_2",
    end2Role: "schedule_saturday_end_2",
  },
  {
    id: "sunday",
    labelKey: "label.schedule.sunday",
    controlRole: "schedule_sunday_control",
    start1Role: "schedule_sunday_start_1",
    end1Role: "schedule_sunday_end_1",
    start2Role: "schedule_sunday_start_2",
    end2Role: "schedule_sunday_end_2",
  },
];

const ROLES: readonly Role[] = DAY_GROUPS.flatMap((group) => [
  group.controlRole,
  group.start1Role,
  group.end1Role,
  group.start2Role,
  group.end2Role,
]);

const SCHEDULE_SUGGESTION_KEYS = new Set<string>(ROLES);

function hhmm(entity: HassEntity | undefined, attrFallback?: unknown): string {
  if (isAvailable(entity) && /^\d{2}:\d{2}/.test(entity.state)) {
    return entity.state.slice(0, 5);
  }
  if (typeof attrFallback === "string" && /^\d{2}:\d{2}/.test(attrFallback)) {
    return attrFallback.slice(0, 5);
  }
  return "00:00";
}

export class WattpilotScheduleCard extends WattpilotBaseCard<ScheduleCardConfig> {
  static override styles = [
    cardStyles,
    css`
      .header {
        align-items: center;
        justify-content: space-between;
      }
      .header-title {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2, 8px);
      }
      .header-title .icon {
        color: var(--wp-accent);
      }
      .copy-button {
        min-block-size: 36px;
        padding-inline: var(--ha-space-3, 12px);
        font-size: var(--ha-font-size-s, 12px);
      }
      .copy-button .icon {
        --mdc-icon-size: 16px;
      }
      .day-group {
        display: grid;
        gap: var(--ha-space-2, 8px);
        padding: var(--ha-space-3, 12px);
        border-radius: var(--ha-border-radius-lg, 12px);
        background: var(--wp-surface);
      }
      .day-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--ha-space-2, 8px);
      }
      .day-title {
        font-weight: var(--ha-font-weight-bold, 600);
        font-size: var(--ha-font-size-m, 14px);
      }
      select,
      input[type="time"] {
        font: inherit;
        color: var(--wp-text);
        background: var(--ha-card-background, var(--card-background-color));
        border: 1px solid var(--wp-divider);
        border-radius: var(--ha-border-radius-md, 8px);
        padding: var(--ha-space-1, 6px) var(--ha-space-2, 10px);
        min-block-size: 36px;
        box-sizing: border-box;
      }
      input[type="time"] {
        font-variant-numeric: tabular-nums;
      }
      .slots {
        display: grid;
        gap: var(--ha-space-2, 8px);
      }
      .slot {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--ha-space-2, 8px);
      }
      .slot-label {
        color: var(--wp-subtext);
        font-size: var(--ha-font-size-s, 12px);
        font-weight: var(--ha-font-weight-medium, 500);
      }
      .slot-times {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2, 8px);
      }
      .arrow {
        color: var(--wp-subtext);
      }
    `,
  ];

  protected readonly roles = ROLES;

  static getConfigForm() {
    return buildConfigForm({
      toggles: [{ name: "show_slot_2", default: false }],
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
    const groups = DAY_GROUPS.filter((g) => this.entity(g.controlRole) !== undefined);
    const weekdayControl = this.entity("schedule_weekday_control");
    const canCopy =
      isAvailable(weekdayControl) &&
      (this.entity("schedule_saturday_control") !== undefined ||
        this.entity("schedule_sunday_control") !== undefined);

    return html`<ha-card>
      <div class="header">
        <div class="header-title">
          ${icon(mdiCalendarClock)}
          <h2 class="section-title">
            ${this.config.title || this.t("label.schedule.title")}
          </h2>
        </div>
        ${canCopy
          ? html`<button
              type="button"
              class="pill-button tonal outlined copy-button"
              @click=${() => this._copyWeekdayToWeekend()}
            >
              ${icon(mdiContentCopy)}
              <span>${this.t("label.schedule.copy_weekday")}</span>
            </button>`
          : nothing}
      </div>
      <div class="stack tight">
        ${groups.map((group) => this.renderDayGroup(group))}
      </div>
    </ha-card>`;
  }

  private renderDayGroup(group: DayGroupDef): TemplateResult {
    const control = this.entity(group.controlRole)!;
    const rawOptions = control.attributes.options;
    const options = Array.isArray(rawOptions) ? rawOptions.map(String) : [];
    const available = isAvailable(control);

    const start1Entity = this.entity(group.start1Role);
    const end1Entity = this.entity(group.end1Role);
    const start2Entity = this.entity(group.start2Role);
    const end2Entity = this.entity(group.end2Role);

    const start1 = hhmm(start1Entity, control.attributes.range_1_start);
    const end1 = hhmm(end1Entity, control.attributes.range_1_end);
    const start2 = hhmm(start2Entity, control.attributes.range_2_start);
    const end2 = hhmm(end2Entity, control.attributes.range_2_end);

    const showSlot2 =
      this.config.show_slot_2 === true ||
      start2 !== "00:00" ||
      end2 !== "00:00" ||
      isAvailable(start2Entity) ||
      isAvailable(end2Entity);

    return html`<section class="day-group" aria-label=${this.t(group.labelKey)}>
      <div class="day-header">
        <span class="day-title">${this.t(group.labelKey)}</span>
        <select
          aria-label="${this.t(group.labelKey)}"
          .value=${control.state}
          ?disabled=${!available}
          @change=${(ev: Event) => {
            const target = ev.target as HTMLSelectElement;
            if (this.hass) void selectOption(this.hass, control.entity_id, target.value);
          }}
        >
          ${options.map(
            (opt) => html`<option value=${opt} ?selected=${opt === control.state}>
              ${localizeOptional(this.hass, `label.schedule.control.${opt}`, opt)}
            </option>`
          )}
        </select>
      </div>
      <div class="slots">
        ${this.renderSlot(
          group,
          this.t("label.schedule.slot1"),
          1,
          start1,
          end1,
          start1Entity,
          end1Entity,
          available
        )}
        ${showSlot2
          ? this.renderSlot(
              group,
              this.t("label.schedule.slot2"),
              2,
              start2,
              end2,
              start2Entity,
              end2Entity,
              available
            )
          : nothing}
      </div>
    </section>`;
  }

  private renderSlot(
    group: DayGroupDef,
    slotLabel: string,
    slotNumber: 1 | 2,
    startVal: string,
    endVal: string,
    startEntity: HassEntity | undefined,
    endEntity: HassEntity | undefined,
    controlAvailable: boolean
  ): TemplateResult {
    return html`<div class="slot">
      <span class="slot-label">${slotLabel}</span>
      <div class="slot-times">
        <input
          type="time"
          aria-label="${this.t(group.labelKey)} ${slotLabel} start"
          .value=${startVal}
          ?disabled=${!controlAvailable}
          @change=${(ev: Event) => {
            const val = (ev.target as HTMLInputElement).value;
            if (/^\d{2}:\d{2}$/.test(val)) {
              this._updateSlotEdge(group, slotNumber, "start", `${val}:00`, startEntity);
            }
          }}
        />
        <span class="arrow" aria-hidden="true">→</span>
        <input
          type="time"
          aria-label="${this.t(group.labelKey)} ${slotLabel} end"
          .value=${endVal}
          ?disabled=${!controlAvailable}
          @change=${(ev: Event) => {
            const val = (ev.target as HTMLInputElement).value;
            if (/^\d{2}:\d{2}$/.test(val)) {
              this._updateSlotEdge(group, slotNumber, "end", `${val}:00`, endEntity);
            }
          }}
        />
      </div>
    </div>`;
  }

  private _updateSlotEdge(
    group: DayGroupDef,
    slotNumber: 1 | 2,
    edge: "start" | "end",
    hms: string,
    timeEntity: HassEntity | undefined
  ): void {
    if (!this.hass) return;
    if (isAvailable(timeEntity)) {
      void setTime(this.hass, timeEntity.entity_id, hms);
      return;
    }
    if (this.config.device_id) {
      const field = `${edge}_time_${slotNumber}`;
      void this.hass.callService(DOMAIN, "set_charging_schedule", {
        device_id: this.config.device_id,
        schedule: group.id,
        [field]: hms,
      });
    }
  }

  private _copyWeekdayToWeekend(): void {
    if (!this.hass || !this.config.device_id) return;
    const control = this.entity("schedule_weekday_control");
    if (!isAvailable(control)) return;
    const start1 = hhmm(
      this.entity("schedule_weekday_start_1"),
      control.attributes.range_1_start
    );
    const end1 = hhmm(
      this.entity("schedule_weekday_end_1"),
      control.attributes.range_1_end
    );
    const start2 = hhmm(
      this.entity("schedule_weekday_start_2"),
      control.attributes.range_2_start
    );
    const end2 = hhmm(
      this.entity("schedule_weekday_end_2"),
      control.attributes.range_2_end
    );
    void this.hass.callService(DOMAIN, "set_charging_schedule", {
      device_id: this.config.device_id,
      schedule: "weekend",
      control: control.state,
      start_time_1: `${start1}:00`,
      end_time_1: `${end1}:00`,
      start_time_2: `${start2}:00`,
      end_time_2: `${end2}:00`,
    });
  }
}

registerCard(
  SCHEDULE_CARD_TAG,
  WattpilotScheduleCard,
  "card.schedule.name",
  "card.schedule.description",
  (hass: HomeAssistant, entityId: string) => {
    const entry = hass.entities?.[entityId];
    if (
      entry?.platform === DOMAIN &&
      entry.translation_key &&
      SCHEDULE_SUGGESTION_KEYS.has(entry.translation_key)
    ) {
      return {
        config: {
          type: `custom:${SCHEDULE_CARD_TAG}`,
          device_id: entry.device_id ?? undefined,
        },
      };
    }
    return null;
  }
);
