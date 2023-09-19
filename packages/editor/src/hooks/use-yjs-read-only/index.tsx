"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React from "react";
import { applyUpdateV2, Doc, YEvent } from "yjs";

import {
  createBinding,
  ExcludedProperties
} from "../../collaboration/bindings";
import { syncYjsChangesToLexical } from "../../utils/sync-yjs-changes-to-lexical";

/**
 * Hook for rendering a read-only instance of the editor
 * @param initialDoc Initial Yjs document
 * @param excludedProperties Excluded properties
 */
export const useYjsReadOnly = ({
  initialDoc,
  excludedProperties
}: {
  excludedProperties?: ExcludedProperties;
  initialDoc: Uint8Array;
}): void => {
  const [editor] = useLexicalComposerContext();
  const { map, doc } = React.useMemo(() => {
    const map = new Map<string, Doc>();
    const doc = new Doc();
    map.set("main", doc);
    return { map, doc };
  }, []);
  const binding = React.useMemo(
    () => createBinding(editor, doc, map, excludedProperties),
    [doc, editor, excludedProperties, map]
  );

  // TODO: Follow https://github.com/facebook/lexical/issues/4999
  {
    const { root } = createBinding(editor, doc, map, excludedProperties);
    const listener = (events: YEvent<any>[]): void => {
      syncYjsChangesToLexical({ binding, events, isFromUndoManger: false });
    };

    root.getSharedType().observeDeep(listener);
    applyUpdateV2(doc, initialDoc);
    root.getSharedType().unobserveDeep(listener);
    doc.destroy();
  }
};
