"use client";

import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { dev_console } from "@storiny/shared/src/utils/dev-log";
import React from "react";
import { applyUpdateV2 as apply_update_v2, Doc, YEvent } from "yjs";

import {
  create_binding,
  ExcludedProperties
} from "../../collaboration/bindings";
import { sync_yjs_changes_to_lexical } from "../../utils/sync-yjs-changes-to-lexical";

/**
 * Hook for rendering a read-only instance of the editor.
 * @param initial_doc The initial binary document data.
 * @param excluded_properties The excluded properties.
 * @param on_read_error The callback invoked when there is an error while reading the `initial_doc` data.
 */
export const use_yjs_read_only = ({
  initial_doc,
  excluded_properties,
  on_read_error
}: {
  excluded_properties?: ExcludedProperties;
  initial_doc: Uint8Array;
  on_read_error?: () => void;
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

    try {
      // This can throw on a corrupted document data.
      apply_update_v2(doc, new Uint8Array(initial_doc));
    } catch (e) {
      dev_console.error(e);
      on_read_error?.();
    }

    root.get_shared_type().unobserveDeep(listener);
    doc.destroy();
  }
};
