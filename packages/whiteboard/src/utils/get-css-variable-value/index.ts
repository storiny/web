/**
 * Computes the value of a CSS variable
 * @param variable The CSS variable
 */
export const get_css_variable_value = (variable: string): string => {
  if (typeof window === "undefined") {
    return "";
  }

  const style = getComputedStyle(document.body);
  const value = style.getPropertyValue(variable);
  // The value can be a font family with fallback: 'font-family-a',
  // 'font-family-b'
  const first_item = value.split(",");

  return first_item[0].replace(/'/g, "");
};
