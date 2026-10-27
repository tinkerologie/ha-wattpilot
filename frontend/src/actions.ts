import type { ActionConfig, HassActionDetail, HomeAssistant } from "./types";

function fireHassAction(node: HTMLElement, entityId: string, action: ActionConfig): void {
  const detail: HassActionDetail = {
    config: { entity: entityId, tap_action: action },
    action: "tap",
  };
  node.dispatchEvent(
    new CustomEvent("hass-action", { detail, bubbles: true, composed: true })
  );
}

/** Open Home Assistant's more-info dialog for an entity. */
export function openMoreInfo(node: HTMLElement, entityId: string): void {
  fireHassAction(node, entityId, { action: "more-info" });
}

/**
 * Press a button entity. With a confirmation text, Home Assistant's own
 * confirmation dialog is shown first.
 */
export function pressButton(
  node: HTMLElement,
  hass: HomeAssistant,
  entityId: string,
  confirmation?: string
): void {
  if (confirmation) {
    fireHassAction(node, entityId, {
      action: "perform-action",
      perform_action: "button.press",
      target: { entity_id: entityId },
      confirmation: { text: confirmation },
    });
    return;
  }
  void hass.callService("button", "press", {}, { entity_id: entityId });
}

export function selectOption(
  hass: HomeAssistant,
  entityId: string,
  option: string
): Promise<unknown> {
  return hass.callService("select", "select_option", { option }, { entity_id: entityId });
}

export function setNumber(
  hass: HomeAssistant,
  entityId: string,
  value: number
): Promise<unknown> {
  return hass.callService("number", "set_value", { value }, { entity_id: entityId });
}

export function setTime(
  hass: HomeAssistant,
  entityId: string,
  time: string
): Promise<unknown> {
  return hass.callService("time", "set_value", { time }, { entity_id: entityId });
}

export function setSwitch(
  hass: HomeAssistant,
  entityId: string,
  on: boolean
): Promise<unknown> {
  return hass.callService("switch", on ? "turn_on" : "turn_off", {}, {
    entity_id: entityId,
  });
}
