let browser_supports_textarea_text_nodes: boolean;

/**
 * Predicate function for determining whether the browser supports
 * text nodes
 * @param input Element
 */
export const can_manipulate_via_text_nodes = (
  input: HTMLTextAreaElement | HTMLInputElement
): boolean => {
  if (input.nodeName !== "TEXTAREA") {
    return false;
  }

  if (typeof browser_supports_textarea_text_nodes === "undefined") {
    const textarea: HTMLTextAreaElement = document.createElement("textarea");
    textarea.value = "1";
    browser_supports_textarea_text_nodes = !!textarea.firstChild;
  }

  return browser_supports_textarea_text_nodes;
};
