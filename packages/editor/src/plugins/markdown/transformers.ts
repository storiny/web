import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ElementTransformer,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  LINK,
  ORDERED_LIST,
  STRIKETHROUGH,
  Transformer,
  UNORDERED_LIST
} from "@lexical/markdown";
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode
} from "@lexical/react/LexicalHorizontalRuleNode";
import { $createLineBreakNode, ElementNode, LexicalNode } from "lexical";

import {
  $createHeadingNode,
  $isHeadingNode,
  HeadingNode
} from "../../nodes/heading";
import { $createQuoteNode, $isQuoteNode, QuoteNode } from "../../nodes/quote";

/**
 * Creates block node
 * @param createNode Callback
 */
const createBlockNode =
  (
    createNode: (match: Array<string>) => ElementNode
  ): ElementTransformer["replace"] =>
  (parentNode, children, match) => {
    const node = createNode(match);
    node.append(...children);
    parentNode.replace(node);
    node.select(0, 0);
  };

const HEADING: ElementTransformer = {
  dependencies: [HeadingNode],
  export: (node, exportChildren) => {
    if (!$isHeadingNode(node)) {
      return null;
    }

    const level = Number(node.getTag().slice(1));
    return "#".repeat(level) + " " + exportChildren(node);
  },
  regExp: /^(#{1,6})\s/,
  replace: createBlockNode((match) => {
    const tag = "h" + match[1].length;
    return $createHeadingNode(["h1", "h2"].includes(tag) ? "h2" : "h3");
  }),
  type: "element"
};

const QUOTE: ElementTransformer = {
  dependencies: [QuoteNode],
  export: (node, exportChildren) => {
    if (!$isQuoteNode(node)) {
      return null;
    }

    const lines = exportChildren(node).split("\n");
    const output = [];

    for (const line of lines) {
      output.push("> " + line);
    }

    return output.join("\n");
  },
  regExp: /^>\s/,
  replace: (parentNode, children, _match, isImport) => {
    if (isImport) {
      const previousNode = parentNode.getPreviousSibling();

      if ($isQuoteNode(previousNode)) {
        previousNode.splice(previousNode.getChildrenSize(), 0, [
          $createLineBreakNode(),
          ...children
        ]);
        previousNode.select(0, 0);
        parentNode.remove();
        return;
      }
    }

    const node = $createQuoteNode();
    node.append(...children);
    parentNode.replace(node);
    node.select(0, 0);
  },
  type: "element"
};

const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: LexicalNode) => ($isHorizontalRuleNode(node) ? "***" : null),
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = $createHorizontalRuleNode();

    // TODO: Get rid of isImport flag
    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }

    line.selectNext();
  },
  type: "element"
};

export const MD_TRANSFORMERS: Array<Transformer> = [
  HR,
  HEADING,
  QUOTE,
  ORDERED_LIST,
  UNORDERED_LIST,
  INLINE_CODE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  LINK
];
