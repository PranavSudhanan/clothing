// A small schema language for admin forms. Sections, settings and simple resources are all
// described as a list of fields and rendered by one generic form component.

export type FieldOption = { value: string; label: string };

export type FieldType =
  | "text"
  | "textarea"
  | "markdown"
  | "number"
  | "boolean"
  | "color"
  | "image"
  | "images"
  | "link"
  | "select"
  | "tags"
  | "datetime"
  | "list"
  | "category"
  | "products"
  | "fabrics"
  | "placement"
  | "measurements"
  | "heading";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  placeholder?: string;
  options?: FieldOption[];
  /** Sub-fields of a `list`. */
  fields?: Field[];
  /** Singular noun used on the "Add …" button of a `list`. */
  itemLabel?: string;
  /** Sub-field shown as the row title of a collapsed `list` item. */
  titleKey?: string;
  width?: "full" | "half" | "third";
  showIf?: { field: string; equals: string | boolean | string[] };
  required?: boolean;
};

export type FieldValues = Record<string, unknown>;

export function fieldVisible(field: Field, values: FieldValues) {
  if (!field.showIf) return true;
  const actual = values[field.showIf.field];
  const expected = field.showIf.equals;
  return Array.isArray(expected) ? expected.includes(String(actual)) : actual === expected;
}

export function emptyValue(field: Field): unknown {
  switch (field.type) {
    case "number":
      return 0;
    case "boolean":
      return false;
    case "images":
    case "tags":
    case "list":
    case "products":
    case "fabrics":
    case "measurements":
      return [];
    case "select":
      return field.options?.[0]?.value ?? "";
    case "color":
      return "#000000";
    default:
      return "";
  }
}

export function emptyValues(fields: Field[]): FieldValues {
  const out: FieldValues = {};
  for (const f of fields) if (f.type !== "heading") out[f.name] = emptyValue(f);
  return out;
}
