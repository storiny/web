"use client";

import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import React from "react";
import { applyUpdateV2 as apply_update_v2, Doc, YEvent } from "yjs";

import {
  create_binding,
  ExcludedProperties
} from "../../collaboration/bindings";
import { sync_yjs_changes_to_lexical } from "../../utils/sync-yjs-changes-to-lexical";

/**
 * Hook for rendering a read-only instance of the editor
 * @param initial_doc Initial Yjs document
 * @param excluded_properties Excluded properties
 */
export const use_yjs_read_only = ({
  initial_doc,
  excluded_properties
}: {
  excluded_properties?: ExcludedProperties;
  initial_doc: Uint8Array;
}): void => {
  const [editor] = use_lexical_composer_context();
  const { map, doc } = React.useMemo(() => {
    const map = new Map<string, Doc>();
    const doc = new Doc();
    map.set("main", doc);
    return { map, doc };
  }, []);
  const binding = React.useMemo(
    () => create_binding(editor, doc, map, excluded_properties),
    [doc, editor, excluded_properties, map]
  );

  // TODO: Follow https://github.com/facebook/lexical/issues/4999
  {
    const { root } = create_binding(editor, doc, map, excluded_properties);
    const listener = (events: YEvent<any>[]): void => {
      sync_yjs_changes_to_lexical({
        binding,
        events,
        is_from_undo_manager: false
      });
    };

    root.get_shared_type().observeDeep(listener);
    apply_update_v2(doc, initial_doc);
    root.get_shared_type().unobserveDeep(listener);
    doc.destroy();
  }
};
