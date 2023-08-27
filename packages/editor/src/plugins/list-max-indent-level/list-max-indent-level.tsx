import { $getListDepth, $isListItemNode, $isListNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { RangeSelection } from "lexical";
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
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
const getElementNodesInSelection = (
  selection: RangeSelection
): Set<ElementNode> => {
  const nodesInSelection = selection.getNodes();

  if (nodesInSelection.length === 0) {
    return new Set([
      selection.anchor.getNode().getParentOrThrow(),
      selection.focus.getNode().getParentOrThrow()
    ]);
  }

  return new Set(
    nodesInSelection.map((n) => ($isElementNode(n) ? n : n.getParentOrThrow()))
  );
};

/**
 * Predicate function for determining whether indentation is permitted
 */
const isIndentPermitted = (): boolean => {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    return false;
  }

  const elementNodesInSelection: Set<ElementNode> =
    getElementNodesInSelection(selection);

  let totalDepth = 0;

  for (const elementNode of elementNodesInSelection) {
    if ($isListNode(elementNode)) {
      totalDepth = Math.max($getListDepth(elementNode) + 1, totalDepth);
    } else if ($isListItemNode(elementNode)) {
      const parent = elementNode.getParent();

      if (!$isListNode(parent)) {
        throw new Error(
          "ListMaxIndentLevelPlugin: A `ListItemNode` must have a `ListNode` for a parent."
        );
      }

      totalDepth = Math.max($getListDepth(parent) + 1, totalDepth);
    }
  }

  return totalDepth <= MAX_DEPTH;
};

const ListMaxIndentLevelPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(
    () =>
      editor.registerCommand(
        INDENT_CONTENT_COMMAND,
        () => !isIndentPermitted(),
        COMMAND_PRIORITY_CRITICAL
      ),
    [editor]
  );

  return null;
};

export default ListMaxIndentLevelPlugin;
