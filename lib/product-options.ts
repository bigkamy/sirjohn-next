export type ProductOptionGroup = { name: string; values: string[] };

/** A chosen configuration, e.g. { "Hand Orientation": "Right Hand", "Shaft Flex": "Stiff" }. */
export type SelectedOptions = Record<string, string>;

/**
 * Checks a selection against a product's option groups (mirrors product_options_valid in
 * the database). Unknown groups are dropped, so a valid result is always canonical.
 */
export function validateOptions(
  groups: ProductOptionGroup[],
  selected: unknown,
): { ok: true; options: SelectedOptions } | { ok: false; missing: string[] } {
  const input = selected && typeof selected === "object" ? (selected as Record<string, unknown>) : {};
  const options: SelectedOptions = {};
  const missing: string[] = [];

  for (const group of groups) {
    const value = input[group.name];
    if (typeof value === "string" && group.values.includes(value)) {
      options[group.name] = value;
    } else {
      missing.push(group.name);
    }
  }

  return missing.length ? { ok: false, missing } : { ok: true, options };
}

/** Stable identity for a configuration, whatever order its keys are in. */
export function optionsKey(options: SelectedOptions) {
  return Object.keys(options)
    .sort()
    .map((name) => `${name}=${options[name]}`)
    .join("|");
}

/** "Hand Orientation: Right Hand · Shaft Flex: Stiff" */
export function formatOptions(options: SelectedOptions) {
  return Object.keys(options)
    .sort()
    .map((name) => `${name}: ${options[name]}`)
    .join(" · ");
}
