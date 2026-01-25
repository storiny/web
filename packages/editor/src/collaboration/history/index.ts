import { UndoManager, XmlText } from "yjs";

import { Binding } from "../bindings";

/**
 * Creates a yjs undo manager instance
 * @param binding Binding
 * @param root Root
 */
export const create_undo_manager = (
  binding: Binding,
  root: XmlText
): UndoManager =>
  new UndoManager(root, {
    trackedOrigins: new Set([binding, null])
  });
