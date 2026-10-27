import { localize, type TranslationKey } from "./localize";
import type { EntitySuggestion, HomeAssistant } from "./types";

const DOCUMENTATION_URL = "https://github.com/tinkerologie/ha-wattpilot#dashboard-cards";

/** Define a card element once and list it in the dashboard card picker. */
export function registerCard(
  tag: string,
  element: CustomElementConstructor,
  nameKey: TranslationKey,
  descriptionKey: TranslationKey,
  getEntitySuggestion?: (hass: HomeAssistant, entityId: string) => EntitySuggestion | null
): void {
  if (!customElements.get(tag)) customElements.define(tag, element);
  const lang = { locale: { language: document.documentElement.lang || "en" } };
  window.customCards ??= [];
  if (!window.customCards.some((card) => card.type === tag)) {
    window.customCards.push({
      type: tag,
      name: localize(lang, nameKey),
      description: localize(lang, descriptionKey),
      preview: true,
      documentationURL: DOCUMENTATION_URL,
      ...(getEntitySuggestion ? { getEntitySuggestion } : {}),
    });
  }
}
