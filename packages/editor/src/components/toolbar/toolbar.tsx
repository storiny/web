"use client";

import { animated, useTransition as use_transition } from "@react-spring/web";
import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import Button from "../../../../ui/src/components/button";
import Spinner from "../../../../ui/src/components/spinner";
import { use_media_query } from "../../../../ui/src/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { doc_status_atom, sidebars_collapsed_atom } from "../../atoms";
import { SPRING_CONFIG } from "../../constants";
import styles from "./toolbar.module.scss";

const SuspendedEditorToolbarContent = dynamic(() => import("./content"), {
  loading: ({ isLoading: is_loading, retry, error }) => (
    <div className={"flex-center"} style={{ height: "40px" }}>
      {error && !is_loading ? (
        <Button color={"ruby"} onClick={retry} size={"sm"} variant={"hollow"}>
          Retry
        </Button>
      ) : (
        <Spinner size={"sm"} />
      )}
    </div>
  )
});

const EditorToolbar = (): React.ReactElement | null => {
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const sidebars_collapsed = use_atom_value(sidebars_collapsed_atom);
  const doc_status = use_atom_value(doc_status_atom);
  const transitions = use_transition(
    sidebars_collapsed || is_smaller_than_desktop,
    {
      from: { opacity: 1, transform: "translate3d(0,100%,0)" },
      enter: { opacity: 1, transform: "translate3d(0,0%,0)" },
      leave: { opacity: 1, transform: "translate3d(0,100%,0)" },
      config: SPRING_CONFIG
    }
  );

  if (["disconnected", "publishing"].includes(doc_status)) {
    return null;
  }

  return (
    <div className={clsx(styles.x, styles.viewport)}>
      {transitions((style, item) =>
        item ? (
          <animated.div
            aria-label={"Formatting options"}
            aria-orientation={"horizontal"}
            className={clsx("flex-center", styles.x, styles.toolbar)}
            role={"toolbar"}
            style={style}
          >
            <SuspendedEditorToolbarContent />
          </animated.div>
        ) : null
      )}
    </div>
  );
};

export default EditorToolbar;
