"use client";

import { useSetAtom as use_set_atom } from "jotai";

import { DOC_STATUS, doc_status_atom } from "../../atoms";
import { ExcludedProperties } from "../../collaboration/bindings";
import { use_yjs_read_only } from "../../hooks/use-yjs-read-only";

interface Props {
  excluded_properties?: ExcludedProperties;
  initial_doc: Uint8Array;
}

const ReadOnlyPlugin = (props: Props): null => {
  const set_doc_status = use_set_atom(doc_status_atom);

  use_yjs_read_only({
    ...props,
    on_read_error: () => set_doc_status(DOC_STATUS.doc_corrupted)
  });

  return null;
};

export default ReadOnlyPlugin;
