import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $setBlocksType } from "@lexical/selection";
import { useAtomValue } from "jotai";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection
} from "lexical";
import React from "react";

import { textStyleAtom } from "../../atoms";
import { nodeToTextStyleMap, TextStyle } from "../../constants";
import { $createHeadingNode, HeadingTagType } from "../../nodes/heading";
import { $createQuoteNode } from "../../nodes/quote";

/**
 * Hook for using text style
 */
export const useTextStyle = (): {
  formatBulletedList: () => void;
  formatHeading: (headingSize: HeadingTagType) => void;
  formatNumberedList: () => void;
  formatParagraph: () => void;
  formatQuote: () => void;
  textStyle: TextStyle;
} => {
  const textStyle = use_atom_value(textStyleAtom);
  const [editor] = useLexicalComposerContext();

  /**
   * Formats paragraph
   */
  const formatParagraph = React.useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  }, [editor]);

  /**
   * Formats heading
   * @param headingSize Heading size
   */
  const formatHeading = React.useCallback(
    (headingSize: HeadingTagType) => {
      if (textStyle !== nodeToTextStyleMap[headingSize]) {
        editor.update(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode(headingSize));
          }
        });
      }
    },
    [editor, textStyle]
  );

  /**
   * Formats bulleted list
   */
  const formatBulletedList = React.useCallback(() => {
    if (textStyle !== TextStyle.BULLETED_LIST) {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  }, [editor, textStyle]);

  /**
   * Formats numbered list
   */
  const formatNumberedList = React.useCallback(() => {
    if (textStyle !== TextStyle.NUMBERED_LIST) {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  }, [editor, textStyle]);

  /**
   * Formats quote
   */
  const formatQuote = React.useCallback(() => {
    if (textStyle !== TextStyle.QUOTE) {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  }, [editor, textStyle]);

  return {
    textStyle,
    formatParagraph,
    formatHeading,
    formatBulletedList,
    formatNumberedList,
    formatQuote
  };
};
