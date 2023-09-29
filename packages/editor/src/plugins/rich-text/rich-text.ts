import {
  $insertDataTransferForRichText as $insert_data_transfer_for_rich_text,
  copyToClipboard as copy_to_clipboard
} from "@lexical/clipboard";
import {
  $moveCharacter as $move_character,
  $shouldOverrideDefaultCharacterSelection as $should_override_default_character_selection
} from "@lexical/selection";
import {
  $findMatchingParent as $find_matching_parent,
  $getNearestBlockElementAncestorOrThrow as $get_nearest_block_element_ancestor_or_throw,
  mergeRegister as merge_register,
  objectKlassEquals as object_klass_equals
} from "@lexical/utils";
import {
  CAN_USE_BEFORE_INPUT,
  IS_APPLE_WEBKIT,
  IS_IOS,
  IS_SAFARI
} from "@storiny/shared/src/browsers";
import type {
  CommandPayloadType,
  ElementFormatType,
  LexicalCommand,
  LexicalEditor,
  PasteCommandType,
  RangeSelection,
  TextFormatType
} from "lexical";
import {
  $createRangeSelection as $create_range_selection,
  $createTabNode as $create_tab_node,
  $getAdjacentNode as $get_adjacent_node,
  $getNearestNodeFromDOMNode as $get_nearest_node_from_dom_node,
  $getRoot as $get_root,
  $getSelection as $get_selection,
  $insertNodes as $insert_nodes,
  $isDecoratorNode as $is_decorator_node,
  $isElementNode as $is_element_node,
  $isNodeSelection as $is_node_selection,
  $isRangeSelection as $is_range_selection,
  $isRootNode as $is_root_node,
  $isTextNode as $is_text_node,
  $normalizeSelection__EXPERIMENTAL as $normalize_selection,
  $selectAll as $select_all,
  $setSelection as $set_selection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  COPY_COMMAND,
  createCommand as create_command,
  CUT_COMMAND,
  DELETE_CHARACTER_COMMAND,
  DELETE_LINE_COMMAND,
  DELETE_WORD_COMMAND,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  ElementNode,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  INSERT_TAB_COMMAND,
  isSelectionCapturedInDecoratorInput as is_selection_captured_in_decorator_input,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  PASTE_COMMAND,
  REMOVE_TEXT_COMMAND,
  SELECT_ALL_COMMAND
} from "lexical";

import { clamp } from "~/utils/clamp";

import { MAX_INDENT_LEVEL } from "../../constants";
import { caret_from_point } from "../../utils/caret-from-point";

export const DRAG_DROP_PASTE: LexicalCommand<Array<File>> = create_command(
  "DRAG_DROP_PASTE_FILE"
);

/**
 * Paste event handler
 * @param event Paste event
 * @param editor Editor
 */
const handle_on_paste = (
  event: CommandPayloadType<typeof PASTE_COMMAND>,
  editor: LexicalEditor
): void => {
  event.preventDefault();
  editor.update(
    () => {
      const selection = $get_selection();
      const clipboard_data =
        event instanceof InputEvent || event instanceof KeyboardEvent
          ? null
          : event.clipboardData;

      if (clipboardData != null && $is_range_selection(selection)) {
        $insert_data_transfer_for_rich_text(clipboard_data, selection, editor);
      }
    },
    {
      tag: "paste"
    }
  );
};

/**
 * Cut event handler
 * @param event Cut event
 * @param editor Editor
 */
const handle_on_cut = async (
  event: CommandPayloadType<typeof CUT_COMMAND>,
  editor: LexicalEditor
): Promise<void> => {
  await copy_to_clipboard(
    editor,
    object_klass_equals(event, ClipboardEvent)
      ? (event as ClipboardEvent)
      : null
  );

  editor.update(() => {
    const selection = $get_selection();
    if ($is_range_selection(selection)) {
      selection.removeText();
    } else if ($is_node_selection(selection)) {
      selection.getNodes().forEach((node) => node.remove());
    }
  });
};

/**
 * Clipboard may contain files that we aren't allowed to read. While the event is arguably useless,
 * on certain occasions, we want to know whether it was a file transfer, as opposed to text. We
 * control this with the first boolean flag.
 * @param event
 */
export const event_files = (
  event: DragEvent | PasteCommandType
): [boolean, Array<File>, boolean] => {
  let data_transfer: null | DataTransfer = null;

  if (event instanceof DragEvent) {
    data_transfer = event.data_transfer;
  } else if (event instanceof ClipboardEvent) {
    data_transfer = event.clipboardData;
  }

  if (data_transfer === null) {
    return [false, [], false];
  }

  const types = data_transfer.types;
  const has_files = types.includes("Files");
  const has_content =
    types.includes("text/html") || types.includes("text/plain");

  return [has_files, Array.from(data_transfer.files), has_content];
};

/**
 * Handles text indentation
 * @param indent_or_outdent Indentation callback
 */
const handle_indent_and_outdent = (
  indent_or_outdent: (block: ElementNode) => void
): boolean => {
  const selection = $get_selection();

  if (!$is_range_selection(selection)) {
    return false;
  }

  const already_handled = new Set();
  const nodes = selection.getNodes();

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const key = node.getKey();

    if (already_handled.has(key)) {
      continue;
    }

    const parent_block = $get_nearest_block_element_ancestor_or_throw(node);
    const parent_key = parent_block.getKey();

    if (parent_block.canIndent() && !already_handled.has(parent_key)) {
      already_handled.add(parent_key);
      indent_or_outdent(parent_block);
    }
  }

  return already_handled.size > 0;
};

/**
 * Predicate function for determining whether the target element is inside a
 * decorator node
 * @param target Target element
 */
const $is_target_within_decorator = (target: HTMLElement): boolean => {
  const node = $get_nearest_node_from_dom_node(target);
  return $is_decorator_node(node);
};

/**
 * Predicate function for determining whether the selection is at the end
 * of the root
 * @param selection Skeleton
 */
const $is_selection_at_end_of_root = (selection: RangeSelection): boolean => {
  const focus = selection.focus;
  return focus.key === "root" && focus.offset === $get_root().getChildrenSize();
};

/**
 * Registers rich text commands
 * @param editor Editor
 */
export const register_rich_text = (editor: LexicalEditor): (() => void) =>
  merge_register(
    editor.registerCommand(
      CLICK_COMMAND,
      () => {
        const selection = $get_selection();

        if ($is_node_selection(selection)) {
          selection.clear();
          return true;
        }

        return false;
      },
      0
    ),
    editor.registerCommand<boolean>(
      DELETE_CHARACTER_COMMAND,
      (is_backward) => {
        const selection = $get_selection();

        if (!$is_range_selection(selection)) {
          return false;
        }

        selection.deleteCharacter(is_backward);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<boolean>(
      DELETE_WORD_COMMAND,
      (is_backward) => {
        const selection = $get_selection();

        if (!$is_range_selection(selection)) {
          return false;
        }

        selection.deleteWord(is_backward);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<boolean>(
      DELETE_LINE_COMMAND,
      (is_backward) => {
        const selection = $get_selection();

        if (!$is_range_selection(selection)) {
          return false;
        }

        selection.deleteLine(is_backward);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      CONTROLLED_TEXT_INSERTION_COMMAND,
      (event_or_text) => {
        const selection = $get_selection();

        if (typeof event_or_text === "string") {
          if ($is_range_selection(selection)) {
            selection.insertText(eventOrText);
          }
        } else {
          if (!$is_range_selection(selection)) {
            return false;
          }

          const data_transfer = event_or_text.dataTransfer;

          if (data_transfer != null) {
            $insert_data_transfer_for_rich_text(
              data_transfer,
              selection,
              editor
            );
          } else if ($is_range_selection(selection)) {
            const data = eventOrText.data;

            if (data) {
              selection.insertText(data);
            }

            return true;
          }
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      REMOVE_TEXT_COMMAND,
      () => {
        const selection = $get_selection();

        if (!$is_range_selection(selection)) {
          return false;
        }

        selection.removeText();
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<TextFormatType>(
      FORMAT_TEXT_COMMAND,
      (format) => {
        const selection = $get_selection();

        if (!$is_range_selection(selection)) {
          return false;
        }

        selection.formatText(format);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<ElementFormatType>(
      FORMAT_ELEMENT_COMMAND,
      (format) => {
        const selection = $get_selection();

        if (!$is_range_selection(selection) && !$is_node_selection(selection)) {
          return false;
        }

        const nodes = selection.getNodes();

        for (const node of nodes) {
          const element = $find_matching_parent(
            node,
            (parentNode) =>
              $is_element_node(parentNode) && !parentNode.isInline()
          );

          if (element !== null) {
            element.setFormat(format);
          }
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<boolean>(
      INSERT_LINE_BREAK_COMMAND,
      (select_start) => {
        const selection = $get_selection();

        if (!$is_range_selection(selection)) {
          return false;
        }

        selection.insertLineBreak(select_start);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND,
      () => {
        const selection = $get_selection();

        if (!$is_range_selection(selection)) {
          return false;
        }

        selection.insertParagraph();
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      INSERT_TAB_COMMAND,
      () => {
        $insert_nodes([$create_tab_node()]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      INDENT_CONTENT_COMMAND,
      () =>
        handle_indent_and_outdent((block) => {
          const indent = block.getIndent();
          block.setIndent(clamp(0, indent + 1, MAX_INDENT_LEVEL));
        }),
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      OUTDENT_CONTENT_COMMAND,
      () =>
        handle_indent_and_outdent((block) => {
          const indent = block.getIndent();
          if (indent > 0) {
            block.setIndent(indent - 1);
          }
        }),
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<KeyboardEvent>(
      KEY_ARROW_UP_COMMAND,
      (event) => {
        const selection = $get_selection();
        if (
          $is_node_selection(selection) &&
          !$is_target_within_decorator(event.target as HTMLElement)
        ) {
          // If selection is on a node, let's try and move selection back to being a range selection.
          const nodes = selection.getNodes();

          if (nodes.length > 0) {
            nodes[0].selectPrevious();
            return true;
          }
        } else if ($is_range_selection(selection)) {
          const possible_node = $get_adjacent_node(selection.focus, true);

          if (
            !event.shiftKey &&
            $is_decorator_node(possible_node) &&
            !possible_node.isIsolated() &&
            !possible_node.isInline()
          ) {
            possible_node.selectPrevious();
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<KeyboardEvent>(
      KEY_ARROW_DOWN_COMMAND,
      (event) => {
        const selection = $get_selection();
        if ($is_node_selection(selection)) {
          // If selection is on a node, let's try and move selection back to being a range selection.
          const nodes = selection.getNodes();

          if (nodes.length > 0) {
            nodes[0].selectNext(0, 0);
            return true;
          }
        } else if ($is_range_selection(selection)) {
          if ($is_selection_at_end_of_root(selection)) {
            event.preventDefault();
            return true;
          }

          const possible_node = $get_adjacent_node(selection.focus, false);

          if (
            !event.shiftKey &&
            $is_decorator_node(possible_node) &&
            !possible_node.isIsolated() &&
            !possible_node.isInline()
          ) {
            possible_node.selectNext();
            event.preventDefault();
            return true;
          }
        }

        return false;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<KeyboardEvent>(
      KEY_ARROW_LEFT_COMMAND,
      (event) => {
        const selection = $get_selection();
        if ($is_node_selection(selection)) {
          // If selection is on a node, let's try and move selection back to being a range selection.
          const nodes = selection.getNodes();

          if (nodes.length > 0) {
            event.preventDefault();
            nodes[0].selectPrevious();
            return true;
          }
        }

        if (!$is_range_selection(selection)) {
          return false;
        }

        if ($should_override_default_character_selection(selection, true)) {
          const is_holding_shift = event.shiftKey;
          event.preventDefault();
          $move_character(selection, is_holding_shift, true);
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<KeyboardEvent>(
      KEY_ARROW_RIGHT_COMMAND,
      (event) => {
        const selection = $get_selection();
        if (
          $is_node_selection(selection) &&
          !$is_target_within_decorator(event.target as HTMLElement)
        ) {
          // If selection is on a node, let's try and move selection back to being a range selection.
          const nodes = selection.getNodes();

          if (nodes.length > 0) {
            event.preventDefault();
            nodes[0].selectNext(0, 0);
            return true;
          }
        }

        if (!$is_range_selection(selection)) {
          return false;
        }

        const is_holding_shift = event.shiftKey;

        if ($should_override_default_character_selection(selection, false)) {
          event.preventDefault();
          $move_character(selection, is_holding_shift, false);
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<KeyboardEvent>(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        if ($is_target_within_decorator(event.target as HTMLElement)) {
          return false;
        }

        const selection = $get_selection();

        if (!$is_range_selection(selection)) {
          return false;
        }

        event.preventDefault();
        const { anchor } = selection;
        const anchor_node = anchor.getNode();

        if (
          selection.isCollapsed() &&
          anchor.offset === 0 &&
          !$is_root_node(anchor_node)
        ) {
          const element =
            $get_nearest_block_element_ancestor_or_throw(anchor_node);

          if (element.getIndent() > 0) {
            return editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
          }
        }

        return editor.dispatchCommand(DELETE_CHARACTER_COMMAND, true);
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<KeyboardEvent>(
      KEY_DELETE_COMMAND,
      (event) => {
        if ($is_target_within_decorator(event.target as HTMLElement)) {
          return false;
        }

        const selection = $get_selection();

        if (!$is_range_selection(selection)) {
          return false;
        }

        event.preventDefault();

        return editor.dispatchCommand(DELETE_CHARACTER_COMMAND, false);
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<KeyboardEvent | null>(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $get_selection();

        if (!$is_range_selection(selection)) {
          return false;
        }

        if (event !== null) {
          /**
           *  If we have `beforeinput`, then we can avoid blocking
           *  the default behavior. This ensures that the iOS can
           *  intercept that we're actually inserting a paragraph,
           *  and autocomplete, autocapitalize, etc. work as intended.
           *  This can also cause a strange performance issue in
           *  Safari, where there is a noticeable pause due to
           *  preventing the key down of `enter`.
           */
          if (
            (IS_IOS || IS_SAFARI || IS_APPLE_WEBKIT) &&
            CAN_USE_BEFORE_INPUT
          ) {
            return false;
          }

          event.preventDefault();

          if (event.shiftKey) {
            return editor.dispatchCommand(INSERT_LINE_BREAK_COMMAND, false);
          }
        }

        return editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        const selection = $get_selection();

        if (!$is_range_selection(selection)) {
          return false;
        }

        editor.blur();

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<DragEvent>(
      DROP_COMMAND,
      (event) => {
        const [, files] = event_files(event);

        if (files.length > 0) {
          const x = event.clientX;
          const y = event.clientY;
          const event_range = caret_from_point(x, y);

          if (event_range !== null) {
            const { offset: dom_offset, node: dom_node } = event_range;
            const node = $get_nearest_node_from_dom_node(dom_node);

            if (node !== null) {
              const selection = $create_range_selection();

              if ($is_text_node(node)) {
                selection.anchor.set(node.getKey(), dom_offset, "text");
                selection.focus.set(node.getKey(), dom_offset, "text");
              } else {
                const parent_key = node.getParentOrThrow().getKey();
                const offset = node.getIndexWithinParent() + 1;
                selection.anchor.set(parent_key, offset, "element");
                selection.focus.set(parent_key, offset, "element");
              }

              const normalized_selection = $normalize_selection(selection);
              $set_selection(normalized_selection);
            }

            editor.dispatchCommand(DRAG_DROP_PASTE, files);
          }

          event.preventDefault();
          return true;
        }

        const selection = $get_selection();
        return !!$is_range_selection(selection);
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<DragEvent>(
      DRAGSTART_COMMAND,
      (event) => {
        const [is_file_transfer] = event_files(event);
        const selection = $get_selection();
        return !(is_file_transfer && !$is_range_selection(selection));
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<DragEvent>(
      DRAGOVER_COMMAND,
      (event) => {
        const [is_file_transfer] = event_files(event);
        const selection = $get_selection();

        if (is_file_transfer && !$is_range_selection(selection)) {
          return false;
        }

        const x = event.clientX;
        const y = event.clientY;
        const event_range = caret_from_point(x, y);

        if (event_range !== null) {
          const node = $get_nearest_node_from_dom_node(event_range.node);

          if ($is_decorator_node(node)) {
            // Show browser caret as the user is dragging the media across the screen. Won't work for `DecoratorNode` nor it's relevant.
            event.preventDefault();
          }
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      SELECT_ALL_COMMAND,
      () => {
        $select_all();
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      COPY_COMMAND,
      (event) => {
        copy_to_clipboard(
          editor,
          object_klass_equals(event, ClipboardEvent)
            ? (event as ClipboardEvent)
            : null
        ).then(() => undefined);

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      CUT_COMMAND,
      (event) => {
        handle_on_cut(event, editor).then(() => undefined);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const [, files, has_text_content] = event_files(event);

        if (files.length > 0 && !has_text_content) {
          editor.dispatchCommand(DRAG_DROP_PASTE, files);
          return true;
        }

        // Ignore creating a new node on paste event if the paste event occured inside an input
        if (is_selection_captured_in_decorator_input(event.target as Node)) {
          return false;
        }

        const selection = $get_selection();

        if ($is_range_selection(selection)) {
          handle_on_paste(event, editor);
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_EDITOR
    )
  );
