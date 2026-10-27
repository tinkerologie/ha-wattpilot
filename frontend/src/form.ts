import { DOMAIN, ROLES, type Role } from "./entities";
import { localize, localizeOptional } from "./localize";

interface FormSchema {
  name: string;
  type?: "grid" | "expandable";
  title?: string;
  flatten?: boolean;
  selector?: Record<string, unknown>;
  schema?: FormSchema[];
  required?: boolean;
  default?: unknown;
}

export interface ConfigForm {
  schema: FormSchema[];
  computeLabel: (schema: FormSchema) => string | undefined;
  computeHelper: (schema: FormSchema) => string | undefined;
}

/** The editor renders inside HA, which keeps <html lang> in sync with the user language. */
function editorLocale(): { locale: { language: string } } {
  return { locale: { language: document.documentElement.lang || "en" } };
}

function humanize(role: string): string {
  const text = role.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export interface FormOptions {
  /** Card-specific boolean toggles, each with an `editor.<name>` label. */
  toggles?: { name: string; default: boolean }[];
  /** Include the consumption (kWh/100 km) field. */
  consumption?: boolean;
  /** Roles offered as optional entity overrides. */
  roles: readonly Role[];
}

export function buildConfigForm(options: FormOptions): ConfigForm {
  const schema: FormSchema[] = [
    {
      name: "device_id",
      required: true,
      selector: { device: { filter: [{ integration: DOMAIN }] } },
    },
    { name: "title", selector: { text: {} } },
  ];
  if (options.consumption) {
    schema.push({
      name: "consumption",
      default: 18,
      selector: {
        number: { min: 5, max: 50, step: 0.1, mode: "box", unit_of_measurement: "kWh/100 km" },
      },
    });
  }
  if (options.toggles?.length) {
    schema.push({
      name: "",
      type: "grid",
      flatten: true,
      schema: options.toggles.map((toggle) => ({
        name: toggle.name,
        default: toggle.default,
        selector: { boolean: {} },
      })),
    });
  }
  schema.push({
    name: "entities",
    type: "expandable",
    title: localize(editorLocale(), "editor.entities"),
    schema: options.roles.map((role) => ({
      name: role,
      selector: {
        entity: { filter: [{ integration: DOMAIN, domain: ROLES[role].domain }] },
      },
    })),
  });

  return {
    schema,
    computeLabel: (field) =>
      localizeOptional(
        editorLocale(),
        `editor.${field.name}`,
        field.name in ROLES ? humanize(field.name) : field.name
      ),
    computeHelper: (field) => {
      if (field.name === "consumption") {
        return localize(editorLocale(), "editor.consumption_helper");
      }
      if (field.name === "entities") {
        return localize(editorLocale(), "editor.entities_helper");
      }
      return undefined;
    },
  };
}
