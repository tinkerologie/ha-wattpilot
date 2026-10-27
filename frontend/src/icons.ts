import { html, svg, type TemplateResult } from "lit";

export {
  mdiAlertCircleOutline,
  mdiCarClock,
  mdiChevronRight,
  mdiClose,
  mdiCogOutline,
  mdiEvPlugType2,
  mdiEvStation,
  mdiHomeBatteryOutline,
  mdiInformationOutline,
  mdiLeaf,
  mdiLightningBolt,
  mdiPlay,
  mdiStop,
  mdiTransmissionTower,
  mdiWhiteBalanceSunny,
} from "@mdi/js";

/** Decorative inline MDI icon; the surrounding control carries the accessible name. */
export function icon(path: string, className = "icon"): TemplateResult {
  return html`<svg
    class=${className}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    ${svg`<path d=${path} fill="currentColor"></path>`}
  </svg>`;
}
