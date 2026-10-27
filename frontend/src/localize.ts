import type { HomeAssistant } from "./types";

const en = {
  "card.charger.name": "Wattpilot charger",
  "card.charger.description":
    "Charging status with live power, session distance and energy, solar flow and quick PV settings.",
  "card.mode.name": "Wattpilot charging mode",
  "card.mode.description":
    "Switch between Standard, Eco and Next trip, and control PV battery charging and charging speed.",
  "card.next_trip.name": "Wattpilot next trip",
  "card.next_trip.description":
    "Set the departure time and energy the car needs for its next trip.",
  "status.no_car.title": "Connect your car",
  "status.no_car.subtitle": "Plug in the cable to start charging your car",
  "status.charging.title": "Charging",
  "status.charging.subtitle": "Your car is charging",
  "status.ready.title": "Ready to charge",
  "status.ready.subtitle": "Your car is connected and waiting for energy",
  "status.complete.title": "Charging complete",
  "status.complete.subtitle": "Your car has finished charging",
  "status.error.title": "Charger error",
  "status.error.subtitle": "Check the charger for details",
  "status.unavailable.title": "Charger unavailable",
  "status.unavailable.subtitle": "Home Assistant cannot reach the charger",
  "label.battery": "PV battery",
  "label.solar": "Solar",
  "label.grid": "Grid",
  "label.charging_power": "Charging power",
  "label.distance": "Distance",
  "label.energy": "Energy",
  "label.per_hour": "{value}/h",
  "label.start": "Start",
  "label.stop": "Stop",
  "label.force_start": "Force start",
  "label.overview": "Overview",
  "label.pv_quick_settings": "PV quick settings",
  "label.pv_surplus": "PV surplus",
  "label.pv_battery_soc": "PV battery SOC",
  "label.charge_above": "Charge car above",
  "label.information": "Information",
  "label.show_information": "Show charger information",
  "label.current": "Current",
  "label.voltage": "Voltage",
  "label.power_factor": "Power factor",
  "label.charging_plug": "Charging plug",
  "label.type2": "Type 2",
  "label.mode.Default": "Standard",
  "label.mode.Eco": "Eco",
  "label.mode.Next Trip": "Next trip",
  "label.mode_hint.Default": "Charge at full power right away",
  "label.mode_hint.Eco": "Sustainable & cost-efficient",
  "label.mode_hint.Next Trip": "Ready by your departure time",
  "label.charging_mode": "Charging mode",
  "label.mode_details": "Charging mode details",
  "label.charging_from_pv_battery": "Charging from PV battery",
  "label.pv_battery_settings": "PV battery settings",
  "label.charging_speed": "Charging speed",
  "label.phase_mode": "Phase mode",
  "label.departure": "Departure time",
  "label.trip_energy": "Energy for the trip",
  "label.remain_in_eco": "Stay in Eco after the trip",
  "label.next_trip_inactive": "Next trip charging is not active.",
  "label.activate_next_trip": "Use Next trip",
  "label.confirm_force_start":
    "Force charging ignores the charging mode and starts charging immediately. Continue?",
  "error.no_device":
    "No Wattpilot charger found. Select a charger in the card editor.",
  "error.entity_missing": "Entity not available",
  "editor.device_id": "Charger",
  "editor.title": "Title",
  "editor.consumption": "Vehicle consumption (kWh/100 km)",
  "editor.consumption_helper":
    "Used to estimate the distance added by the session and the charging speed in km/h.",
  "editor.show_power_flow": "Show solar, grid and battery power",
  "editor.show_pv_settings": "Show PV quick settings page",
  "editor.show_force_start": "Show force start button",
  "editor.confirm_force_start": "Ask before force starting",
  "editor.show_pv_battery": "Show PV battery charging",
  "editor.show_charging_speed": "Show charging speed",
  "editor.show_phase_mode": "Show phase mode",
  "editor.show_remain_in_eco": "Show stay in Eco switch",
  "editor.entities": "Entity overrides",
  "editor.entities_helper":
    "Optional. Pick entities only when automatic detection on the charger picks the wrong one.",
} as const;

export type TranslationKey = keyof typeof en;

const de: Partial<Record<TranslationKey, string>> = {
  "card.charger.name": "Wattpilot Ladestation",
  "card.charger.description":
    "Ladestatus mit Leistung, Reichweite und Energie der Sitzung, PV-Fluss und PV-Schnelleinstellungen.",
  "card.mode.name": "Wattpilot Lademodus",
  "card.mode.description":
    "Zwischen Standard, Eco und Nächste Fahrt wechseln sowie Laden aus dem PV-Speicher und Ladestrom steuern.",
  "card.next_trip.name": "Wattpilot Nächste Fahrt",
  "card.next_trip.description":
    "Abfahrtszeit und benötigte Energie für die nächste Fahrt festlegen.",
  "status.no_car.title": "Fahrzeug anschließen",
  "status.no_car.subtitle": "Stecke das Kabel ein, um mit dem Laden zu beginnen",
  "status.charging.title": "Lädt",
  "status.charging.subtitle": "Dein Fahrzeug wird geladen",
  "status.ready.title": "Bereit zum Laden",
  "status.ready.subtitle": "Fahrzeug verbunden, wartet auf Energie",
  "status.complete.title": "Laden abgeschlossen",
  "status.complete.subtitle": "Dein Fahrzeug ist fertig geladen",
  "status.error.title": "Fehler am Wattpilot",
  "status.error.subtitle": "Prüfe die Ladestation für Details",
  "status.unavailable.title": "Wattpilot nicht erreichbar",
  "status.unavailable.subtitle": "Home Assistant erreicht die Ladestation nicht",
  "label.battery": "PV-Speicher",
  "label.solar": "PV",
  "label.grid": "Netz",
  "label.charging_power": "Ladeleistung",
  "label.distance": "Reichweite",
  "label.energy": "Energie",
  "label.start": "Starten",
  "label.stop": "Stoppen",
  "label.force_start": "Sofort laden",
  "label.overview": "Übersicht",
  "label.pv_quick_settings": "PV-Schnelleinstellungen",
  "label.pv_surplus": "PV-Überschuss",
  "label.pv_battery_soc": "PV-Speicher SOC",
  "label.charge_above": "Fahrzeug laden ab",
  "label.information": "Information",
  "label.show_information": "Informationen zur Ladestation anzeigen",
  "label.current": "Strom",
  "label.voltage": "Spannung",
  "label.power_factor": "Leistungsfaktor",
  "label.charging_plug": "Ladestecker",
  "label.type2": "Typ 2",
  "label.mode.Default": "Standard",
  "label.mode.Eco": "Eco",
  "label.mode.Next Trip": "Nächste Fahrt",
  "label.mode_hint.Default": "Sofort mit voller Leistung laden",
  "label.mode_hint.Eco": "Nachhaltig & kosteneffizient",
  "label.mode_hint.Next Trip": "Bis zur Abfahrt geladen",
  "label.charging_mode": "Lademodus",
  "label.mode_details": "Details zum Lademodus",
  "label.charging_from_pv_battery": "Laden aus dem PV-Speicher",
  "label.pv_battery_settings": "Einstellungen PV-Speicher",
  "label.charging_speed": "Ladestrom",
  "label.phase_mode": "Phasenumschaltung",
  "label.departure": "Abfahrtszeit",
  "label.trip_energy": "Energie für die Fahrt",
  "label.remain_in_eco": "Nach der Fahrt im Eco-Modus bleiben",
  "label.next_trip_inactive": "Laden für die nächste Fahrt ist nicht aktiv.",
  "label.activate_next_trip": "Nächste Fahrt verwenden",
  "label.confirm_force_start":
    "Sofortladen ignoriert den Lademodus und startet sofort. Fortfahren?",
  "error.no_device":
    "Kein Wattpilot gefunden. Wähle im Karteneditor eine Ladestation aus.",
  "error.entity_missing": "Entität nicht verfügbar",
  "editor.device_id": "Ladestation",
  "editor.title": "Titel",
  "editor.consumption": "Fahrzeugverbrauch (kWh/100 km)",
  "editor.consumption_helper":
    "Wird zur Schätzung der geladenen Reichweite und der Ladegeschwindigkeit in km/h verwendet.",
  "editor.show_power_flow": "PV-, Netz- und Speicherleistung anzeigen",
  "editor.show_pv_settings": "Seite PV-Schnelleinstellungen anzeigen",
  "editor.show_force_start": "Schaltfläche Sofort laden anzeigen",
  "editor.confirm_force_start": "Vor dem Sofortladen nachfragen",
  "editor.show_pv_battery": "Laden aus dem PV-Speicher anzeigen",
  "editor.show_charging_speed": "Ladestrom anzeigen",
  "editor.show_phase_mode": "Phasenumschaltung anzeigen",
  "editor.show_remain_in_eco": "Schalter Im Eco-Modus bleiben anzeigen",
  "editor.entities": "Entitäten überschreiben",
  "editor.entities_helper":
    "Optional. Nur auswählen, wenn die automatische Erkennung die falsche Entität findet.",
};

const tables: Record<string, Partial<Record<TranslationKey, string>>> = { en, de };

export function language(hass?: Pick<HomeAssistant, "locale" | "language">): string {
  return (hass?.locale?.language ?? hass?.language ?? "en").split("-")[0] ?? "en";
}

export function localize(
  hass: Pick<HomeAssistant, "locale" | "language"> | undefined,
  key: TranslationKey,
  replacements: Record<string, string> = {}
): string {
  const text = tables[language(hass)]?.[key] ?? en[key];
  return Object.entries(replacements).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, value),
    text
  );
}

/** Localised label for a card key that may not exist (e.g. an unexpected mode option). */
export function localizeOptional(
  hass: Pick<HomeAssistant, "locale" | "language"> | undefined,
  key: string,
  fallback: string
): string {
  return key in en ? localize(hass, key as TranslationKey) : fallback;
}
