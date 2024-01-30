/**
 * Computes the value of a CSS variable
 * @param variable The CSS variable
 */
export const get_css_variable_value = (variable: string): string => {
  if (typeof window === "undefined") {
    return "";
  }

  const style = getComputedStyle(document.body);
  return style.getPropertyValue(variable);
};
