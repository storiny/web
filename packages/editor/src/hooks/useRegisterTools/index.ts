import { $isLinkNode } from "@lexical/link";
import { $isListNode, ListNode, ListType } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode } from "@lexical/rich-text";
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
  canRedoAtom,
  canUndoAtom,
  codeAtom,
  italicAtom,
  linkAtom,
  strikethroughAtom,
  subscriptAtom,
  superscriptAtom,
  textStyleAtom,
  underlineAtom
} from "../../atoms";
import { Alignment, TextStyle } from "../../constants";
import { getSelectedNode } from "../../utils/getSelectedNode";

const listTypeToTextStyleMap: Record<Exclude<ListType, "check">, TextStyle> = {
  bullet: TextStyle.BULLETED_LIST,
  number: TextStyle.NUMBERED_LIST
};

/**
 * Hook for registering tools to the editor instance
 */
export const useRegisterTools = (): void => {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = React.useState(editor);
  const setTextStyle = useSetAtom(textStyleAtom);
  const setAlignment = useSetAtom(alignmentAtom);
  const setLink = useSetAtom(linkAtom);
  const setBold = useSetAtom(boldAtom);
  const setItalic = useSetAtom(italicAtom);
  const setUnderline = useSetAtom(underlineAtom);
  const setStrikethrough = useSetAtom(strikethroughAtom);
  const setSubscript = useSetAtom(subscriptAtom);
  const setSuperscript = useSetAtom(superscriptAtom);
  const setCode = useSetAtom(codeAtom);
  const setCanUndo = useSetAtom(canUndoAtom);
  const setCanRedo = useSetAtom(canRedoAtom);

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
      const elementDOM = activeEditor.getElementByKey(elementKey);

      // Update text format
      setBold(selection.hasFormat("bold"));
      setItalic(selection.hasFormat("italic"));
      setUnderline(selection.hasFormat("underline"));
      setStrikethrough(selection.hasFormat("strikethrough"));
      setSubscript(selection.hasFormat("subscript"));
      setSuperscript(selection.hasFormat("superscript"));
      setCode(selection.hasFormat("code"));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();

      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setLink(true);
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
          console.log("heading:", type);
          // if (type in blockTypeToBlockName) {
          //   setBlockType(type as keyof typeof blockTypeToBlockName);
          // }
        }
      }

      const alignment =
        ($isElementNode(node)
          ? node.getFormatType()
          : parent?.getFormatType()) || Alignment.LEFT;

      if (Object.values(Alignment).includes(alignment as Alignment)) {
        setAlignment(alignment as Alignment);
      } else {
        setAlignment(undefined);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditor]);

  React.useEffect(
    () =>
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          $updateTools();
          setActiveEditor(newEditor);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
    [editor, $updateTools]
  );

  React.useEffect(
    () =>
      mergeRegister(
        // editor.registerEditableListener((editable) => {
        //   setIsEditable(editable);
        // }),
        activeEditor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => {
            $updateTools();
          });
        }),
        activeEditor.registerCommand<boolean>(
          CAN_UNDO_COMMAND,
          (payload) => {
            setCanUndo(payload);
            return false;
          },
          COMMAND_PRIORITY_CRITICAL
        ),
        activeEditor.registerCommand<boolean>(
          CAN_REDO_COMMAND,
          (payload) => {
            setCanRedo(payload);
            return false;
          },
          COMMAND_PRIORITY_CRITICAL
        )
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [$updateTools, activeEditor, editor]
  );

  // React.useEffect(
  //   () =>
  //     activeEditor.registerCommand(
  //       KEY_MODIFIER_COMMAND,
  //       (payload) => {
  //         const event: KeyboardEvent = payload;
  //         const { code, ctrlKey, metaKey } = event;
  //
  //         if (code === "KeyK" && (ctrlKey || metaKey)) {
  //           event.preventDefault();
  //           return activeEditor.dispatchCommand(
  //             TOGGLE_LINK_COMMAND,
  //             sanitizeUrl("https://")
  //           );
  //         }
  //         return false;
  //       },
  //       COMMAND_PRIORITY_NORMAL
  //     ),
  //   [activeEditor, link]
  // );
  //
  // const insertLink = React.useCallback(() => {
  //   if (!link) {
  //     editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl("https://"));
  //   } else {
  //     editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  //   }
  // }, [editor, link]);
};
