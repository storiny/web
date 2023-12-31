"use client";

import { useSetAtom as use_set_atom } from "jotai";
import { usePathname as use_pathname } from "next/navigation";
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

// TODO: Uncomment after fixing
// const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;
const SIX_HOURS_IN_MS = 30 * 1000; // 30 seconds for now

const ReadOnlyPlugin = ({
  excluded_properties,
  initial_doc,
  story_id,
  reading_session_token
}: Props): null => {
  const pathname = use_pathname();
  const set_doc_status = use_set_atom(doc_status_atom);
  const has_read_ref = React.useRef<boolean>(false);
  const prev_pathname_ref = React.useRef<string>(pathname);
  const [read_story] = use_read_story_mutation();

  use_yjs_read_only({
    excluded_properties,
    initial_doc,
    on_read_error: () => set_doc_status(DOC_STATUS.doc_corrupted)
  });

  // TODO: Fix this block. The `handle_read` is not called/inconsistent on page
  // unload. For now, we're using a fixed window of 30 seconds.
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

    if (prev_pathname_ref.current !== pathname) {
      handle_read();
    }

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
  }, [pathname, read_story, reading_session_token, story_id]);

  return null;
};

export default ReadOnlyPlugin;
