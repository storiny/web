"use client";

/**
 * Copies text to the clipboard
 * @param text The text to copy
 */
export const copyToClipboard = async (text: string) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => undefined);
  } else {
    // Old way to copy text using textarea
    const textField = document.createElement("textarea");
    textField.innerText = text;
    textField.hidden = true;

    document.body.appendChild(textField);

    if (window.navigator.platform === "iPhone") {
      textField.setSelectionRange(0, 99999);
    } else {
      textField.select();
    }

    document.execCommand("copy");
    textField.remove();
  }
};
