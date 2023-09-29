import { can_manipulate_via_text_nodes } from "../can-manipulate-via-text-nodes";

/**
 * Inserts text at the current selection position
 * @param input Element
 * @param text Text to insert
 */
export const insert_text_at_position = (
  input: HTMLTextAreaElement | HTMLInputElement,
  text: string
): void => {
  input.focus();
  const is_success =
    document.execCommand && document.execCommand("insertText", false, text);

  if (!is_success) {
    const start = input.selectionStart!;
    const end = input.selectionEnd!;

    if (typeof input.setRangeText === "function") {
      input.setRangeText(text);
    } else {
      const range = document.createRange();
      const text_node = document.createTextNode(text);

      if (can_manipulate_via_text_nodes(input)) {
        let node = input.firstChild;

        if (!node) {
          input.appendChild(text_node);
        } else {
          let offset = 0;
          let start_node = null;
          let end_node = null;

          while (node && (start_node === null || end_node === null)) {
            const node_length = node.nodeValue!.length;

            if (start >= offset && start <= offset + node_length) {
              range.setStart((start_node = node), start - offset);
            }

            if (end >= offset && end <= offset + node_length) {
              range.setEnd((end_node = node), end - offset);
            }

            offset += node_length;
            node = node.nextSibling;
          }

          if (start !== end) {
            range.deleteContents();
          }
        }
      }

      if (
        can_manipulate_via_text_nodes(input) &&
        range.commonAncestorContainer.nodeName === "#text"
      ) {
        range.insertNode(text_node);
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
