import {
  $getListDepth as $get_list_depth,
  $isListItemNode as $is_list_item_node,
  $isListNode as $is_list_node
} from "@lexical/list";
import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import type { RangeSelection } from "lexical";
import {
  $getSelection as $get_selection,
  $isElementNode as $is_element_node,
  $isRangeSelection as $is_range_selection,
  COMMAND_PRIORITY_CRITICAL,
  ElementNode,
  INDENT_CONTENT_COMMAND
} from "lexical";
import React from "react";

const MAX_DEPTH = 3;

/**
 * Returns the element nodes present in the selection
 * @param selection Selection
 */
const get_element_nodes_in_selection = (
  selection: RangeSelection
): Set<ElementNode> => {
  const nodes_in_selection = selection.getNodes();

  if (nodes_in_selection.length === 0) {
    return new Set([
      selection.anchor.getNode().getParentOrThrow(),
      selection.focus.getNode().getParentOrThrow()
    ]);
  }

  return new Set(
    nodes_in_selection.map((n) =>
      $is_element_node(n) ? n : n.getParentOrThrow()
    )
  );
};

/**
 * Predicate function for determining whether indentation is permitted
 */
const is_indent_permitted = (): boolean => {
  const selection = $get_selection();

  if (!$is_range_selection(selection)) {
    return false;
  }

  const element_nodes_in_selection: Set<ElementNode> =
    get_element_nodes_in_selection(selection);

  let total_depth = 0;

  for (const element_node of element_nodes_in_selection) {
    if ($is_list_node(element_node)) {
      total_depth = Math.max($get_list_depth(element_node) + 1, total_depth);
    } else if ($is_list_item_node(element_node)) {
      const parent = element_node.getParent();

      if (!$is_list_node(parent)) {
        throw new Error(
          "ListMaxIndentLevelPlugin: A `ListItemNode` must have a `ListNode` for a parent."
        );
      }

      total_depth = Math.max($get_list_depth(parent) + 1, total_depth);
    }
  }

  return total_depth <= MAX_DEPTH;
};

const ListMaxIndentLevelPlugin = (): null => {
  const [editor] = use_lexical_composer_context();

  React.useEffect(
    () =>
      editor.registerCommand(
        INDENT_CONTENT_COMMAND,
        () => !is_indent_permitted(),
        COMMAND_PRIORITY_CRITICAL
      ),
    [editor]
  );

  return null;
};

export default ListMaxIndentLevelPlugin;
