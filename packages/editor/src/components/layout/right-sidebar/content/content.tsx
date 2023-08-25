"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { animated, useTransition } from "@react-spring/web";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Divider from "~/components/Divider";

import { documentLoadingAtom, sidebarsCollapsedAtom } from "../../../../atoms";
import { springConfig } from "../../../../constants";
import styles from "../right-sidebar.module.scss";
import Alignment from "./alignment";
import Appearance from "./appearance";
import History from "./history";
import Indentation from "./indentation";
import Insert from "./insert";
import PaddedDivider from "./padded-divider";
import TextStyle from "./text-style";

const SuspendedEditorRightSidebarContent = (): React.ReactElement => {
  const [editor] = useLexicalComposerContext();
  const isCollapsed = useAtomValue(sidebarsCollapsedAtom);
  const documentLoading = useAtomValue(documentLoadingAtom);
  const transitions = useTransition(!isCollapsed, {
    from: { opacity: 0, transform: "translate3d(10%,0,0) scale(0.97)" },
    enter: { opacity: 1, transform: "translate3d(0%,0,0) scale(1)" },
    leave: { opacity: 0, transform: "translate3d(10%,0,0) scale(0.97)" },
    config: springConfig
  });

  return transitions((style, item) =>
    item ? (
      <animated.div
        aria-busy={documentLoading}
        className={clsx("flex-col", styles.x, styles.content)}
        style={{ ...style, pointerEvents: documentLoading ? "none" : "auto" }}
      >
        <div className={"flex-center"}>
          <History disabled={documentLoading} />
          <PaddedDivider />
          <Alignment disabled={documentLoading} />
          <PaddedDivider />
          <Indentation disabled={documentLoading} />
        </div>
        <Divider />
        <TextStyle disabled={documentLoading} />
        <Divider />
        <Insert disabled={documentLoading} />
        <Divider />
        <Appearance disabled={documentLoading} />
      </animated.div>
    ) : null
  );
};

export default SuspendedEditorRightSidebarContent;
