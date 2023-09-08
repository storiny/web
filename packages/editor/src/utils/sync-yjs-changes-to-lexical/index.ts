import { $createOffsetView } from "@lexical/offset";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  EditorState
} from "lexical";
import { Text as YText, YEvent, YMapEvent, YTextEvent, YXmlEvent } from "yjs";

import { Binding } from "../../collab/bindings";
import { CollabDecoratorNode } from "../../collab/nodes/decorator";
import { CollabElementNode } from "../../collab/nodes/element";
import { CollabTextNode } from "../../collab/nodes/text";
import { Provider } from "../../collab/provider";
import { doesSelectionNeedRecovering } from "../does-selection-need-recovering";
import { getOrInitCollabNodeFromSharedType } from "../get-or-init-collab-node-from-shared-type";
import { syncCursorPositions } from "../sync-cursor-positions";
import { syncLexicalSelectionToYjs } from "../sync-lexical-selection-to-yjs";
import { syncLocalCursorPosition } from "../sync-local-cursor-position";

/**
 * Syncs data from a yjs event
 * @param binding Binding
 * @param event Event
 */
const syncEvent = (binding: Binding, event: any): void => {
  const { target } = event;
  const collabNode = getOrInitCollabNodeFromSharedType(binding, target);

  if (collabNode instanceof CollabElementNode && event instanceof YTextEvent) {
    // @ts-expect-error We need to access the private property of the class
    const { keysChanged, childListChanged, delta } = event;

    // Update
    if (keysChanged.size > 0) {
      collabNode.syncPropertiesFromYjs(binding, keysChanged);
    }

    if (childListChanged) {
      collabNode.applyChildrenYjsDelta(binding, delta);
      collabNode.syncChildrenFromYjs(binding);
    }
  } else if (
    collabNode instanceof CollabTextNode &&
    event instanceof YMapEvent
  ) {
    const { keysChanged } = event;

    // Update
    if (keysChanged.size > 0) {
      collabNode.syncPropertiesAndTextFromYjs(binding, keysChanged);
    }
  } else if (
    collabNode instanceof CollabDecoratorNode &&
    event instanceof YXmlEvent
  ) {
    const { attributesChanged } = event;

    // Update
    if (attributesChanged.size > 0) {
      collabNode.syncPropertiesFromYjs(binding, attributesChanged);
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
 * @param isFromUndoManger Whether the changes are from the undo manager
 */
export const syncYjsChangesToLexical = (
  binding: Binding,
  provider: Provider,
  events: Array<YEvent<YText>>,
  isFromUndoManger: boolean
): void => {
  const editor = binding.editor;
  const currentEditorState = editor._editorState;

  // This line precomputes the delta before the editor updates. The reason is
  // delta is computed when it is accessed. Note that this can only be
  // safely computed during the event call. If it is accessed after the event
  // call, it might result in unexpected behavior.
  // https://github.com/yjs/yjs/blob/00ef472d68545cb260abd35c2de4b3b78719c9e4/src/utils/YEvent.js#L132
  events.forEach((event) => event.delta);

  editor.update(
    () => {
      const pendingEditorState: EditorState | null = editor._pendingEditorState;

      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        syncEvent(binding, event);
      }

      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        // We can't use yjs's cursor position here, as it doesn't always
        // handle selection recovery correctly – especially on elements that
        // get moved around or split. So instead, we roll our own solution.
        if (doesSelectionNeedRecovering(selection)) {
          const prevSelection = currentEditorState._selection;

          if ($isRangeSelection(prevSelection)) {
            const prevOffsetView = $createOffsetView(
              editor,
              0,
              currentEditorState
            );
            const nextOffsetView = $createOffsetView(
              editor,
              0,
              pendingEditorState
            );
            const [start, end] =
              prevOffsetView.getOffsetsFromSelection(prevSelection);
            const nextSelection =
              start >= 0 && end >= 0
                ? nextOffsetView.createSelectionFromOffsets(
                    start,
                    end,
                    prevOffsetView
                  )
                : null;

            if (nextSelection !== null) {
              $setSelection(nextSelection);
            } else {
              // Fallback is to use the Yjs cursor position
              syncLocalCursorPosition(binding, provider);

              if (doesSelectionNeedRecovering(selection)) {
                const root = $getRoot();

                // If there was a collision on the top level paragraph,
                // we need to re-add a paragraph
                if (root.getChildrenSize() === 0) {
                  root.append($createParagraphNode());
                }

                // Fallback
                $getRoot().selectEnd();
              }
            }
          }

          syncLexicalSelectionToYjs(
            binding,
            provider,
            prevSelection,
            $getSelection()
          );
        } else {
          syncLocalCursorPosition(binding, provider);
        }
      }
    },
    {
      onUpdate: () => syncCursorPositions(binding, provider),
      skipTransforms: true,
      tag: isFromUndoManger ? "historic" : "collaboration"
    }
  );
};
