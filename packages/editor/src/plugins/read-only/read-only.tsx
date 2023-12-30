"use client";

import { useSetAtom as use_set_atom } from "jotai";
import React from "react";

import { use_read_story_mutation } from "~/redux/features";

import { DOC_STATUS, doc_status_atom } from "../../atoms";
import { ExcludedProperties } from "../../collaboration/bindings";
import { use_yjs_read_only } from "../../hooks/use-yjs-read-only";

interface Props {
  excluded_properties?: ExcludedProperties;
  initial_doc: Uint8Array;
  reading_session_token: string;
  story_id: string;
}

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

const ReadOnlyPlugin = ({
  excluded_properties,
  initial_doc,
  story_id,
  reading_session_token
}: Props): null => {
  const set_doc_status = use_set_atom(doc_status_atom);
  const has_read_ref = React.useRef<boolean>(false);
  const [read_story] = use_read_story_mutation();

  use_yjs_read_only({
    excluded_properties,
    initial_doc,
    on_read_error: () => set_doc_status(DOC_STATUS.doc_corrupted)
  });

  React.useEffect(() => {
    const handle_read = (): void => {
      if (has_read_ref.current) {
        return;
      }

      has_read_ref.current = true;

      read_story({
        id: story_id,
        token: reading_session_token,
        referrer: document.referrer
      });
    };

    window.addEventListener("beforeunload", handle_read);
    window.addEventListener("unload", handle_read);
    window.addEventListener("pagehide", handle_read);

    // Fallback
    const timer = setTimeout(handle_read, SIX_HOURS_IN_MS);

    return () => {
      window.removeEventListener("beforeunload", handle_read);
      window.removeEventListener("unload", handle_read);
      window.removeEventListener("pagehide", handle_read);

      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default ReadOnlyPlugin;
