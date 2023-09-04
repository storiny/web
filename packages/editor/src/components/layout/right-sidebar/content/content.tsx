"use client";

import { animated, useTransition } from "@react-spring/web";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Divider from "~/components/Divider";

import {
  docStatusAtom,
  figureOffsetsAtom,
  sidebarsCollapsedAtom
} from "../../../../atoms";
import { springConfig } from "../../../../constants";
import styles from "../right-sidebar.module.scss";
import Alignment from "./alignment";
import Appearance from "./appearance";
import History from "./history";
import Indentation from "./indentation";
import Insert from "./insert";
import PaddedDivider from "./padded-divider";
import TextStyle from "./text-style";

const SuspendedEditorRightSidebarContent = (): React.ReactElement | null => {
  const isCollapsed = useAtomValue(sidebarsCollapsedAtom);
  const docStatus = useAtomValue(docStatusAtom);
  const transitions = useTransition(!isCollapsed, {
    from: { opacity: 0, transform: "translate3d(10%,0,0) scale(0.97)" },
    enter: { opacity: 1, transform: "translate3d(0%,0,0) scale(1)" },
    leave: { opacity: 0, transform: "translate3d(10%,0,0) scale(0.97)" },
    config: springConfig
  });
  const documentLoading = ["connecting", "reconnecting"].includes(docStatus);

  const figureOffsets = useAtomValue(figureOffsetsAtom);
  const hei = React.useMemo(
    () => Math.max(...Object.values(figureOffsets).map(([, offset]) => offset)),
    [figureOffsets]
  );

  if (docStatus === "disconnected") {
    return null;
  }

  return transitions((style, item) =>
    item ? (
      <animated.div
        aria-busy={documentLoading}
        className={clsx("flex-col", styles.x, styles.content)}
        style={{
          ...style,
          transform: `translateY(calc(100vh - 52px + ${hei}px))`,
          pointerEvents: documentLoading ? "none" : "auto"
        }}
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
        <div
          style={{
            width: "5px",
            //    height: `calc(100vh - ${hei}px)`,
            background: "red",
            marginRight: "-64px"
          }}
        />
      </animated.div>
    ) : null
  );
};

export default SuspendedEditorRightSidebarContent;
