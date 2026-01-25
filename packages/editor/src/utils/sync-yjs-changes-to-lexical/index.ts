import { $createOffsetView as $create_offset_view } from "@lexical/offset";
import {
  $createParagraphNode as $create_paragraph_node,
  $getRoot as $get_root,
  $getSelection as $get_selection,
  $isRangeSelection as $is_range_selection,
  $setSelection as $set_selection,
  EditorState
} from "lexical";
import {
  Text as YText,
  XmlElement,
  YEvent,
  YMapEvent,
  YTextEvent,
  YXmlEvent
} from "yjs";

import { Binding } from "../../collaboration/bindings";
import { CollabDecoratorNode } from "../../collaboration/nodes/decorator";
import { CollabElementNode } from "../../collaboration/nodes/element";
import { CollabTextNode } from "../../collaboration/nodes/text";
import { Provider } from "../../collaboration/provider";
import { does_selection_need_recovering } from "../does-selection-need-recovering";
import { get_or_create_collab_node_from_shared_type } from "../get-or-create-collab-node-from-shared-type";
import { sync_cursor_positions } from "../sync-cursor-positions";
import { sync_lexical_selection_to_yjs } from "../sync-lexical-selection-to-yjs";
import { sync_local_cursor_position } from "../sync-local-cursor-position";

/**
 * Syncs data from a yjs event
 * @param binding Binding
 * @param event Event
 */
const sync_event = (binding: Binding, event: YEvent<any>): void => {
  const { target } = event;

  // Ignore code-block text type
  if (
    target instanceof YText &&
    target.parent instanceof XmlElement &&
    target.parent._collab_node.get_type() === "code-block"
  ) {
    return;
  }

  const collab_node = get_or_create_collab_node_from_shared_type(
    binding,
    target
  );

  if (collab_node instanceof CollabElementNode && event instanceof YTextEvent) {
    // @ts-expect-error We need to access the private property of the class

    const { keysChanged, childListChanged, delta } = event;

    // Update
    if (keysChanged.size > 0) {
      collab_node.sync_properties_from_yjs(binding, keysChanged);
    }

    if (childListChanged) {
      collab_node.apply_children_yjs_delta(binding, delta);
      collab_node.sync_children_from_yjs(binding);
    }
  } else if (
    collab_node instanceof CollabTextNode &&
    event instanceof YMapEvent
  ) {
    const { keysChanged } = event;

    // Update
    if (keysChanged.size > 0) {
      collab_node.sync_properties_and_text_from_yjs(binding, keysChanged);
    }
  } else if (
    collab_node instanceof CollabDecoratorNode &&
    event instanceof YXmlEvent
  ) {
    const { attributesChanged } = event;

    // Update
    if (attributesChanged.size > 0) {
      collab_node.sync_properties_from_yjs(binding, attributesChanged);
    }
  } else {
    throw new Error("Unknown node event");
  }
};

/**
 * Syncs yjs changes to editor
 * @param binding Binding
 * @param provider Provider
 * @param events Events
 * @param is_from_undo_manager Whether the changes are from the undo manager
 * @param read_only If `true`, skips handling selection and cursors
 */
export const sync_yjs_changes_to_lexical = ({
  provider,
  binding,
  is_from_undo_manager,
  read_only,
  events
}: {
  binding: Binding;
  events: Array<YEvent<YText>>;
  is_from_undo_manager: boolean;
  provider?: Provider;
  read_only?: boolean;
}): void => {
  const editor = binding.editor;
  const curr_editor_state = editor._editorState;

  /**
   * This line precomputes the delta before the editor updates. The reason is
   * that the delta is computed when it is accessed. Note that this can only be
   * safely computed during the event call. If it is accessed after the event
   * call, it might result in unexpected behavior.
   * @see https://github.com/yjs/yjs/blob/00ef472d68545cb260abd35c2de4b3b78719c9e4/src/utils/YEvent.js#L132
   */
  events.forEach((event) => event.delta);

  editor.update(
    () => {
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        sync_event(binding, event);
      }

      if (!provider || read_only) {
        return;
      }

      const pending_editor_state: EditorState | null =
        editor._pendingEditorState;
      const selection = $get_selection();

      if ($is_range_selection(selection)) {
        /**
         * We can't use yjs's cursor position here, as it doesn't always
         * handle selection recovery correctly – especially on elements that
         * get moved around or split. So instead, we roll our own solution.
         */
        if (does_selection_need_recovering(selection)) {
          const prev_selection = curr_editor_state._selection;

          if ($is_range_selection(prev_selection)) {
            const prev_offset_view = $create_offset_view(
              editor,
              0,
              curr_editor_state
            );
            const next_offset_view = $create_offset_view(
              editor,
              0,
              pending_editor_state
            );
            const [start, end] =
              prev_offset_view.getOffsetsFromSelection(prev_selection);
            const next_selection =
              start >= 0 && end >= 0
                ? next_offset_view.createSelectionFromOffsets(
                    start,
                    end,
                    prev_offset_view
                  )
                : null;

            if (next_selection !== null) {
              $set_selection(next_selection);
            } else {
              // Fallback is to use the Yjs cursor position
              sync_local_cursor_position(binding, provider);

              if (does_selection_need_recovering(selection)) {
                const root = $get_root();

                // If there was a collision on the top level paragraph, we need
                // to re-add a paragraph
                if (root.getChildrenSize() === 0) {
                  root.append($create_paragraph_node());
                }

                // Fallback
                $get_root().selectEnd();
              }
            }
          }

          sync_lexical_selection_to_yjs(
            binding,
            provider,
            prev_selection,
            $get_selection()
          );
        } else {
          sync_local_cursor_position(binding, provider);
        }
      }
    },
    {
      onUpdate:
        !provider || read_only
          ? undefined
          : (): void => sync_cursor_positions(binding, provider),

      skipTransforms: true,
      tag: is_from_undo_manager ? "historic" : "collaboration"
    }
  );
};
