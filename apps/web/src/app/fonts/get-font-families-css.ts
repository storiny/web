/**
 * Converts a font family classname map to CSS string
 * @param families Font family classname map
 */
export const get_font_families_css = (
  families: Record<string, string>
): string =>
  Object.keys(families)
    .concat("") // Add a semicolon at the end
    .map((key) => (key ? `--font-${key}:${families[key]}` : ""))
    .join(";");
