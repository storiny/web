import {
  autocompletion,
  closeBrackets as close_brackets,
  closeBracketsKeymap as close_brackets_keymap,
  completionKeymap as completion_keymap
} from "@codemirror/autocomplete";
import {
  defaultKeymap as default_keymap,
  indentWithTab as indent_with_tab
} from "@codemirror/commands";
import {
  bracketMatching as bracket_matching,
  foldKeymap as fold_keymap,
  indentOnInput as indent_on_input
} from "@codemirror/language";
import { lintKeymap as lint_keymap } from "@codemirror/lint";
import { highlightSelectionMatches as highlight_selection_matches } from "@codemirror/search";
import { EditorState, Extension } from "@codemirror/state";
import {
  crosshairCursor as crosshair_cursor,
  drawSelection as draw_selection,
  dropCursor as drop_cursor,
  EditorView,
  keymap,
  rectangularSelection as rectangular_selection
} from "@codemirror/view";
import {
  $getNodeByKey as $get_node_by_key,
  LexicalEditor,
  NodeKey
} from "lexical";
import { Awareness } from "y-protocols/awareness";
import { Text as YText, UndoManager } from "yjs";

import { code_block_remote_selections } from "../../../../../../collaboration/code-block/selection";
import {
  code_block_sync,
  code_block_sync_facet,
  YSyncConfig
} from "../../../../../../collaboration/code-block/sync";
import {
  code_block_undo_manager,
  code_block_undo_manager_facet,
  CodeBlockUndoManagerConfig,
  redo,
  undo
} from "../../../../../../collaboration/code-block/undo-manager";
import { $is_code_block_node } from "../../../../code-block";

/**
 * Returns the set of code editor extensions for editable component.
 * @param content Yjs text instance
 * @param awareness Client awareness
 * @param undo_manager Undo manager instance
 * @param editor Editor instance
 * @param node_key Key of the code block node
 * @param focus_editor Callback to focus the main editor
 */
export const get_editable_extensions = ({
  content,
  awareness,
  undo_manager,
  editor,
  node_key,
  focus_editor
}: {
  awareness: Awareness | null;
  content: YText;
  editor: LexicalEditor;
  focus_editor: () => void;
  node_key: NodeKey;
  undo_manager: UndoManager | null;
}): Extension[] => {
  const collab_extensions = [
    code_block_sync_facet.of(new YSyncConfig(content, awareness)),
    code_block_sync
  ];

  if (awareness !== null) {
    collab_extensions.push(code_block_remote_selections);
  }

  if (undo_manager !== null) {
    collab_extensions.push(
      code_block_undo_manager_facet.of(
        new CodeBlockUndoManagerConfig(undo_manager)
      ),
      code_block_undo_manager,
      EditorView.domEventHandlers({
        beforeinput: (event, view) => {
          switch (event.inputType) {
            case "historyUndo":
              return undo(view);
            case "historyRedo":
              return redo(view);
            // Remove the node if backspace key is pressed and the code
            // block is empty
            case "deleteContentBackward":
              if (!view.state.doc.toString().length) {
                editor.update(() => {
                  const node = $get_node_by_key(node_key);

                  if ($is_code_block_node(node)) {
                    node.remove();
                    focus_editor();
                  }
                });

                return;
              }
          }

          return false;
        }
      })
    );
  }

  return [
    /* eslint-disable prefer-snakecase/prefer-snakecase */
    ...collab_extensions,
    draw_selection(),
    drop_cursor(),
    indent_on_input(),
    bracket_matching(),
    close_brackets(),
    autocompletion({ closeOnBlur: true }),
    rectangular_selection(),
    crosshair_cursor(),
    highlight_selection_matches(),
    EditorState.allowMultipleSelections.of(true),
    keymap.of([
      indent_with_tab,
      ...close_brackets_keymap,
      ...default_keymap,
      ...fold_keymap,
      ...completion_keymap,
      ...lint_keymap
    ])
    /* eslint-enable prefer-snakecase/prefer-snakecase */
  ];
};
