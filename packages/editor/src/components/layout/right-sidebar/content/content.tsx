"use client";

import { animated, useTransition } from "@react-spring/web";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Divider from "~/components/Divider";

import {
  docStatusAtom,
  overflowingFiguresAtom,
  sidebarsCollapsedAtom
} from "../../../../atoms";
import { springConfig } from "../../../../constants";
import commonStyles from "../../common/sidebar.module.scss";
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
  const overflowingFigures = useAtomValue(overflowingFiguresAtom);
  const transitions = useTransition(!isCollapsed, {
    from: { opacity: 0, transform: "translate3d(10%,0,0) scale(0.97)" },
    enter: { opacity: 1, transform: "translate3d(0%,0,0) scale(1)" },
    leave: { opacity: 0, transform: "translate3d(10%,0,0) scale(0.97)" },
    config: springConfig
  });
  const documentLoading = ["connecting", "reconnecting"].includes(docStatus);

  if (docStatus === "disconnected") {
    return null;
  }

  return transitions((style, item) =>
    item ? (
      <animated.div
        aria-busy={documentLoading}
        className={clsx(
          "flex-col",
          styles.x,
          styles.content,
          commonStyles.x,
          commonStyles.content
        )}
        data-hidden={String(Boolean(overflowingFigures.size))}
        style={{
          ...style,
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
            background: "red",
            marginRight: "-64px"
          }}
        />
      </animated.div>
    ) : null
  );
};

export default SuspendedEditorRightSidebarContent;
