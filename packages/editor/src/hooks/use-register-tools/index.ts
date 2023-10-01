import { $isLinkNode as $is_link_node } from "@lexical/link";
import {
  $isListNode as $is_list_node,
  ListNode,
  ListType
} from "@lexical/list";
import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import {
  $findMatchingParent as $find_matching_parent,
  $getNearestNodeOfType as $get_nearest_node_of_type,
  mergeRegister as merge_register
} from "@lexical/utils";
import { useSetAtom as use_set_atom } from "jotai";
import {
  $getSelection as $get_selection,
  $isElementNode as $is_element_node,
  $isRangeSelection as $is_range_selection,
  $isRootOrShadowRoot as $is_root_or_shadow_root,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND
} from "lexical";
import React from "react";

import {
  alignment_atom,
  bold_atom,
  can_indent_atom,
  can_outdent_atom,
  can_redo_atom,
  can_undo_atom,
  code_atom,
  is_caption_selection_atom,
  italic_atom,
  link_atom,
  strikethrough_atom,
  subscript_atom,
  superscript_atom,
  text_style_atom,
  underline_atom
} from "../../atoms";
import {
  Alignment,
  MAX_INDENT_LEVEL,
  NODE_TEXT_STYLE_MAP,
  TextStyle
} from "../../constants";
import { $is_caption_node } from "../../nodes/caption";
import { $is_heading_node } from "../../nodes/heading";
import { get_selected_node } from "../../utils/get-selected-node";

const LIST_TYPE_TEXT_STYLE_MAP: Record<
  Exclude<ListType, "check">,
  TextStyle
> = {
  bullet: TextStyle.BULLETED_LIST,
  number: TextStyle.NUMBERED_LIST
};

/**
 * Hook for registering tools to the editor instance
 */
export const use_register_tools = (): void => {
  const [editor] = use_lexical_composer_context();
  const set_text_style = use_set_atom(text_style_atom);
  const set_alignment = use_set_atom(alignment_atom);
  const set_link = use_set_atom(link_atom);
  const set_bold = use_set_atom(bold_atom);
  const set_italic = use_set_atom(italic_atom);
  const set_underline = use_set_atom(underline_atom);
  const set_strikethrough = use_set_atom(strikethrough_atom);
  const set_subscript = use_set_atom(subscript_atom);
  const set_superscript = use_set_atom(superscript_atom);
  const set_code = use_set_atom(code_atom);
  const set_can_indent = use_set_atom(can_indent_atom);
  const set_can_outdent = use_set_atom(can_outdent_atom);
  const set_can_undo = use_set_atom(can_undo_atom);
  const set_can_redo = use_set_atom(can_redo_atom);
  const set_is_caption_selection = use_set_atom(is_caption_selection_atom);

  /**
   * Updates tools
   */
  const $update_tools = React.useCallback(() => {
    const selection = $get_selection();

    if ($is_range_selection(selection)) {
      const anchor_node = selection.anchor.getNode();
      let element =
        anchor_node.getKey() === "root"
          ? anchor_node
          : $find_matching_parent(anchor_node, (e) => {
              const parent = e.getParent();
              return parent !== null && $is_root_or_shadow_root(parent);
            });

      if (element === null) {
        element = anchor_node.getTopLevelElementOrThrow();
      }

      const element_key = element.getKey();
      const element_dom = editor.getElementByKey(element_key);

      // Update text format
      set_bold(selection.hasFormat("bold"));
      set_italic(selection.hasFormat("italic"));
      set_underline(selection.hasFormat("underline"));
      set_strikethrough(selection.hasFormat("strikethrough"));
      set_subscript(selection.hasFormat("subscript"));
      set_superscript(selection.hasFormat("superscript"));
      set_code(selection.hasFormat("code"));

      const node = get_selected_node(selection);
      const parent = node.getParent();
      let is_caption = $is_caption_node(node) || $is_caption_node(parent);

      // Update links
      if ($is_link_node(parent) || $is_link_node(node)) {
        set_link(true);

        // When the selection is around a link, the parent is resolved to link node, so we need to resolve the parent caption node if it is present
        is_caption = $is_caption_node(parent?.getParent());
      } else {
        set_link(false);
      }

      if (element_dom !== null) {
        if ($is_list_node(element)) {
          const parent_list = $get_nearest_node_of_type<ListNode>(
            anchor_node,
            ListNode
          );
          const type = (
            parent_list ? parent_list.getListType() : element.getListType()
          ) as Exclude<ListType, "check">;

          set_text_style(LIST_TYPE_TEXT_STYLE_MAP[type]);
        } else {
          const type = $is_heading_node(element)
            ? element.get_tag()
            : element.getType();

          if (type in NODE_TEXT_STYLE_MAP) {
            set_text_style(NODE_TEXT_STYLE_MAP[type]);
          }
        }
      }

      // Update caption predicate
      set_is_caption_selection(is_caption);

      // Update indentation

      const indentation = $is_element_node(node)
        ? node.getIndent()
        : parent?.getIndent() || 0;

      set_can_indent(!is_caption && indentation < MAX_INDENT_LEVEL);
      set_can_outdent(!is_caption && indentation > 0);

      // Update alignment

      const alignment =
        ($is_element_node(node)
          ? node.getFormatType()
          : parent?.getFormatType()) || Alignment.LEFT;

      if (
        !is_caption &&
        Object.values(Alignment).includes(alignment as Alignment)
      ) {
        set_alignment(alignment as Alignment);
      } else {
        set_alignment(undefined);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(
    () =>
      merge_register(
        editor.registerUpdateListener(({ editorState: editor_state }) =>
          editor_state.read($update_tools)
        ),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            $update_tools();
            return false;
          },
          COMMAND_PRIORITY_CRITICAL
        ),
        editor.registerCommand<boolean>(
          CAN_UNDO_COMMAND,
          (payload) => {
            set_can_undo(payload);
            return false;
          },
          COMMAND_PRIORITY_CRITICAL
        ),
        editor.registerCommand<boolean>(
          CAN_REDO_COMMAND,
          (payload) => {
            set_can_redo(payload);
            return false;
          },
          COMMAND_PRIORITY_CRITICAL
        )
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [$update_tools, editor]
  );
};
