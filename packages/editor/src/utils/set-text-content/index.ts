import { IS_FIREFOX } from "@storiny/shared/src/browsers";
import { TextNode } from "lexical";

import { COMPOSITION_SUFFIX } from "../../constants";
import { diffComposedText } from "../diff-composed-text";

/**
 * Sets the text content for a node
 * @param nextText Text
 * @param dom DOM node
 * @param node Text node
 */
export const setTextContent = (
  nextText: string,
  dom: HTMLElement,
  node: TextNode
): void => {
  const firstChild = dom.firstChild;
  const isComposing = node.isComposing();
  // Always add a suffix if we're composing a node
  const suffix = isComposing ? COMPOSITION_SUFFIX : "";
  const text: string = nextText + suffix;

  if (firstChild == null) {
    dom.textContent = text;
  } else {
    const nodeValue = firstChild.nodeValue;

    if (nodeValue !== text) {
      if (isComposing || IS_FIREFOX) {
        // We also use the diff composed text for general text in FF to avoid
        // the spellcheck red line from flickering.
        const [index, remove, insert] = diffComposedText(
          nodeValue as string,
          text
        );

        if (remove !== 0) {
          // @ts-expect-error
          firstChild.deleteData(index, remove);
        }

        // @ts-expect-error
        firstChild.insertData(index, insert);
      } else {
        firstChild.nodeValue = text;
      }
    }
  }
};
