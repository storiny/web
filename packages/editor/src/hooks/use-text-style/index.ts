import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND
} from "@lexical/list";
import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { $setBlocksType as $set_blocks_type } from "@lexical/selection";
import { useAtomValue as use_atom_value } from "jotai";
import {
  $createParagraphNode as $create_paragraph_node,
  $getSelection as $get_selection,
  $isRangeSelection as $is_range_selection
} from "lexical";
import React from "react";

import { text_style_atom } from "../../atoms";
import { NODE_TEXT_STYLE_MAP, TextStyle } from "../../constants";
import { $create_heading_node, HeadingTagType } from "../../nodes/heading";
import { $create_quote_node } from "../../nodes/quote";

/**
 * Hook for using text style
 */
export const use_text_style = (): {
  format_bulleted_list: () => void;
  format_heading: (tag: HeadingTagType) => void;
  format_numbered_list: () => void;
  format_paragraph: () => void;
  format_quote: () => void;
  text_style: TextStyle;
} => {
  const text_style = use_atom_value(text_style_atom);
  const [editor] = use_lexical_composer_context();

  /**
   * Formats paragraph
   */
  const format_paragraph = React.useCallback(() => {
    editor.update(() => {
      const selection = $get_selection();

      if ($is_range_selection(selection)) {
        $set_blocks_type(selection, $create_paragraph_node);
      }
    });
  }, [editor]);

  /**
   * Formats heading
   * @param size Heading size
   */
  const format_heading = React.useCallback(
    (size: HeadingTagType) => {
      if (text_style !== NODE_TEXT_STYLE_MAP[size]) {
        editor.update(() => {
          const selection = $get_selection();

          if ($is_range_selection(selection)) {
            $set_blocks_type(selection, () => $create_heading_node(size));
          }
        });
      }
    },
    [editor, text_style]
  );

  /**
   * Formats bulleted list
   */
  const format_bulleted_list = React.useCallback(() => {
    if (text_style !== TextStyle.BULLETED_LIST) {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  }, [editor, text_style]);

  /**
   * Formats numbered list
   */
  const format_numbered_list = React.useCallback(() => {
    if (text_style !== TextStyle.NUMBERED_LIST) {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  }, [editor, text_style]);

  /**
   * Formats quote
   */
  const format_quote = React.useCallback(() => {
    if (text_style !== TextStyle.QUOTE) {
      editor.update(() => {
        const selection = $get_selection();

        if ($is_range_selection(selection)) {
          $set_blocks_type(selection, $create_quote_node);
        }
      });
    }
  }, [editor, text_style]);

  return {
    text_style,
    format_paragraph,
    format_heading,
    format_bulleted_list,
    format_numbered_list,
    format_quote
  };
};
