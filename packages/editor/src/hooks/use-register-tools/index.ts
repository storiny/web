import { $isLinkNode } from "@lexical/link";
import { $isListNode, ListNode, ListType } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  mergeRegister
} from "@lexical/utils";
import { useSetAtom } from "jotai";
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND
} from "lexical";
import React from "react";

import {
  alignmentAtom,
  boldAtom,
  canIndentAtom,
  canOutdentAtom,
  canRedoAtom,
  canUndoAtom,
  codeAtom,
  isCaptionSelectionAtom,
  italicAtom,
  linkAtom,
  strikethroughAtom,
  subscriptAtom,
  superscriptAtom,
  textStyleAtom,
  underlineAtom
} from "../../atoms";
import {
  Alignment,
  MAX_INDENT_LEVEL,
  nodeToTextStyleMap,
  TextStyle
} from "../../constants";
import { $isCaptionNode } from "../../nodes/caption";
import { $isHeadingNode } from "../../nodes/heading";
import { getSelectedNode } from "../../utils/get-selected-node";

const listTypeToTextStyleMap: Record<Exclude<ListType, "check">, TextStyle> = {
  bullet: TextStyle.BULLETED_LIST,
  number: TextStyle.NUMBERED_LIST
};

/**
 * Hook for registering tools to the editor instance
 */
export const useRegisterTools = (): void => {
  const [editor] = useLexicalComposerContext();
  const setTextStyle = use_set_atom(textStyleAtom);
  const setAlignment = use_set_atom(alignmentAtom);
  const setLink = use_set_atom(linkAtom);
  const setBold = use_set_atom(boldAtom);
  const setItalic = use_set_atom(italicAtom);
  const setUnderline = use_set_atom(underlineAtom);
  const setStrikethrough = use_set_atom(strikethroughAtom);
  const setSubscript = use_set_atom(subscriptAtom);
  const setSuperscript = use_set_atom(superscriptAtom);
  const setCode = use_set_atom(codeAtom);
  const setCanIndent = use_set_atom(canIndentAtom);
  const setCanOutdent = use_set_atom(canOutdentAtom);
  const setCanUndo = use_set_atom(canUndoAtom);
  const setCanRedo = use_set_atom(canRedoAtom);
  const setIsCaptionSelection = use_set_atom(isCaptionSelectionAtom);

  /**
   * Updates tools
   */
  const $updateTools = React.useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      // Update text format
      setBold(selection.hasFormat("bold"));
      setItalic(selection.hasFormat("italic"));
      setUnderline(selection.hasFormat("underline"));
      setStrikethrough(selection.hasFormat("strikethrough"));
      setSubscript(selection.hasFormat("subscript"));
      setSuperscript(selection.hasFormat("superscript"));
      setCode(selection.hasFormat("code"));

      const node = getSelectedNode(selection);
      const parent = node.getParent();
      let isCaption = $isCaptionNode(node) || $isCaptionNode(parent);

      // Update links
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setLink(true);

        // When the selection is around a link, the parent is resolved to link node,
        // so we need to resolve the parent caption node if it is present
        isCaption = $isCaptionNode(parent?.getParent());
      } else {
        setLink(false);
      }

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode
          );
          const type = (
            parentList ? parentList.getListType() : element.getListType()
          ) as Exclude<ListType, "check">;

          setTextStyle(listTypeToTextStyleMap[type]);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();

          if (type in nodeToTextStyleMap) {
            setTextStyle(nodeToTextStyleMap[type]);
          }
        }
      }

      // Update caption predicate
      setIsCaptionSelection(isCaption);

      // Update indentation

      const indentation = $isElementNode(node)
        ? node.getIndent()
        : parent?.getIndent() || 0;

      setCanIndent(!isCaption && indentation < MAX_INDENT_LEVEL);
      setCanOutdent(!isCaption && indentation > 0);

      // Update alignment

      const alignment =
        ($isElementNode(node)
          ? node.getFormatType()
          : parent?.getFormatType()) || Alignment.LEFT;

      if (
        !isCaption &&
        Object.values(Alignment).includes(alignment as Alignment)
      ) {
        setAlignment(alignment as Alignment);
      } else {
        setAlignment(undefined);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) =>
          editorState.read($updateTools)
        ),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            $updateTools();
            return false;
          },
          COMMAND_PRIORITY_CRITICAL
        ),
        editor.registerCommand<boolean>(
          CAN_UNDO_COMMAND,
          (payload) => {
            setCanUndo(payload);
            return false;
          },
          COMMAND_PRIORITY_CRITICAL
        ),
        editor.registerCommand<boolean>(
          CAN_REDO_COMMAND,
          (payload) => {
            setCanRedo(payload);
            return false;
          },
          COMMAND_PRIORITY_CRITICAL
        )
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [$updateTools, editor]
  );
};
