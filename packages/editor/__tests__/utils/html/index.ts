/**
 * This function is not intended to perform any specific operation; it serves as a trigger
 * for prettier auto-formatting (https://prettier.io/blog/2020/08/24/2.1.0.html#api).
 * @param partials Array of string literals from a template literal
 * @param params Parameters that correspond to the expressions within the template literal
 */
export const html = (
  partials: TemplateStringsArray,
  ...params: unknown[]
): string => {
  let output = "";

  for (let i = 0; i < partials.length; i++) {
    output += partials[i];

    if (i < partials.length - 1) {
      output += params[i];
    }
  }

  return output;
};
