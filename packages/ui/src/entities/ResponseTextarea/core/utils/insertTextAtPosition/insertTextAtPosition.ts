import { canManipulateViaTextNodes } from "../canManipulateViaTextNodes";

/**
 * Inserts text at the current selection position
 * @param input Element
 * @param text Text to insert
 */
export const insertTextAtPosition = (
  input: HTMLTextAreaElement | HTMLInputElement,
  text: string
): void => {
  input.focus();

  const isSuccess =
    document.execCommand && document.execCommand("insertText", false, text);

  if (!isSuccess) {
    const start = input.selectionStart!;
    const end = input.selectionEnd!;

    if (typeof input.setRangeText === "function") {
      input.setRangeText(text);
    } else {
      const range = document.createRange();
      const textNode = document.createTextNode(text);

      if (canManipulateViaTextNodes(input)) {
        let node = input.firstChild;

        if (!node) {
          input.appendChild(textNode);
        } else {
          let offset = 0;
          let startNode = null;
          let endNode = null;

          while (node && (startNode === null || endNode === null)) {
            const nodeLength = node.nodeValue!.length;

            if (start >= offset && start <= offset + nodeLength) {
              range.setStart((startNode = node), start - offset);
            }

            if (end >= offset && end <= offset + nodeLength) {
              range.setEnd((endNode = node), end - offset);
            }

            offset += nodeLength;
            node = node.nextSibling;
          }

          if (start !== end) {
            range.deleteContents();
          }
        }
      }

      if (
        canManipulateViaTextNodes(input) &&
        range.commonAncestorContainer.nodeName === "#text"
      ) {
        range.insertNode(textNode);
      } else {
        const value = input.value || "";
        input.value = value.slice(0, start) + text + value.slice(end);
      }
    }

    input.setSelectionRange(start + text.length, start + text.length);
    input.dispatchEvent(
      new UIEvent("input", { bubbles: true, cancelable: false })
    );
  }
};
