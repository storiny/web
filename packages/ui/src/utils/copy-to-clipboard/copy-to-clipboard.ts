"use client";

/**
 * Copies a text to the clipboard
 * @param text Text to copy
 */
export const copy_to_clipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => undefined);
  } else {
    // Old way to copy text using textarea
    const textarea = document.createElement("textarea");
    textarea.innerText = text;
    textarea.hidden = true;

    document.body.appendChild(textarea);

    if (window.navigator.platform === "iPhone") {
      textarea.setSelectionRange(0, 99999);
    } else {
      textarea.select();
    }

    document.execCommand("copy");
    textarea.remove();
  }
};
