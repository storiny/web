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

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

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

  React.useEffect(() => {
    const handle_read = (): void => {
      if (has_read_ref.current) {
        return;
      }

      has_read_ref.current = true;

      read_story({
        id: story_id,
        token: reading_session_token,
        referrer: document.referrer || ""
      });
    };

    if (prev_pathname_ref.current !== pathname) {
      handle_read();
    }

    const handle_read_via_beacon = (): void => {
      if (document.visibilityState === "hidden" && !has_read_ref.current) {
        has_read_ref.current = true;

        navigator.sendBeacon(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/v1/public/stories/${story_id}/read?token=${reading_session_token}&referrer=${encodeURIComponent(
            document.referrer || ""
          )}`
        );
      }
    };

    document.addEventListener("visibilitychange", handle_read_via_beacon);

    // Fallbacks

    if (!("sendBeacon" in navigator)) {
      window.addEventListener("pagehide", handle_read);
    }

    const timer = setTimeout(handle_read, SIX_HOURS_IN_MS);

    return () => {
      document.removeEventListener("visibilitychange", handle_read_via_beacon);

      if (!("sendBeacon" in navigator)) {
        window.removeEventListener("pagehide", handle_read);
      }

      clearTimeout(timer);
    };
  }, [pathname, read_story, reading_session_token, story_id]);

  return null;
};

export default ReadOnlyPlugin;
