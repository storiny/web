let browserSupportsTextareaTextNodes: boolean;

/**
 * Predicate function for determining whether the browser supports
 * text nodes
 * @param input Element
 */
export const canManipulateViaTextNodes = (
  input: HTMLTextAreaElement | HTMLInputElement
): boolean => {
  if (input.nodeName !== "TEXTAREA") {
    return false;
  }

  if (typeof browserSupportsTextareaTextNodes === "undefined") {
    const textarea: HTMLTextAreaElement = document.createElement("textarea");
    textarea.value = "1";
    browserSupportsTextareaTextNodes = !!textarea.firstChild;
  }

  return browserSupportsTextareaTextNodes;
};
