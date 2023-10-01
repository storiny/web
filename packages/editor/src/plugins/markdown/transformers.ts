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
  $createHorizontalRuleNode as $create_horizontal_rule_node,
  $isHorizontalRuleNode as $is_horizontal_rule_node,
  HorizontalRuleNode
} from "@lexical/react/LexicalHorizontalRuleNode";
import {
  $createLineBreakNode as $create_line_break_node,
  ElementNode,
  LexicalNode
} from "lexical";

import {
  $create_heading_node,
  $is_heading_node,
  HeadingNode
} from "../../nodes/heading";
import {
  $create_quote_node,
  $is_quote_node,
  QuoteNode
} from "../../nodes/quote";

/**
 * Creates block node
 * @param create_node Callback
 */
const create_block_node =
  (
    create_node: (match: Array<string>) => ElementNode
  ): ElementTransformer["replace"] =>
  (parent_node, children, match) => {
    const node = create_node(match);
    node.append(...children);
    parent_node.replace(node);
    node.select(0, 0);
  };

const HEADING: ElementTransformer = {
  dependencies: [HeadingNode],
  export: (node, export_children) => {
    if (!$is_heading_node(node)) {
      return null;
    }

    const level = Number(node.get_tag().slice(1));
    return "#".repeat(level) + " " + export_children(node);
  },
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  regExp: /^(#{1,6})\s/,
  replace: create_block_node((match) => {
    const tag = "h" + match[1].length;
    return $create_heading_node(["h1", "h2"].includes(tag) ? "h2" : "h3");
  }),
  type: "element"
};

const QUOTE: ElementTransformer = {
  dependencies: [QuoteNode],
  export: (node, export_children) => {
    if (!$is_quote_node(node)) {
      return null;
    }

    const lines = export_children(node).split("\n");
    const output = [];

    for (const line of lines) {
      output.push("> " + line);
    }

    return output.join("\n");
  },
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  regExp: /^>\s/,
  replace: (parent_node, children, _match, is_import) => {
    if (is_import) {
      const prev_node = parent_node.getPreviousSibling();

      if ($is_quote_node(prev_node)) {
        prev_node.splice(prev_node.getChildrenSize(), 0, [
          $create_line_break_node(),
          ...children
        ]);
        prev_node.select(0, 0);
        parent_node.remove();
        return;
      }
    }

    const node = $create_quote_node();
    node.append(...children);
    parent_node.replace(node);
    node.select(0, 0);
  },
  type: "element"
};

const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: LexicalNode) =>
    $is_horizontal_rule_node(node) ? "***" : null,
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parent_node, _1, _2, is_import) => {
    const line = $create_horizontal_rule_node();

    // TODO: Get rid of is_import flag
    if (is_import || parent_node.getNextSibling() != null) {
      parent_node.replace(line);
    } else {
      parent_node.insertBefore(line);
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
