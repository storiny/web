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
} from "../../../atoms";
import { springConfig } from "../../../constants";
import commonStyles from "../common/sidebar.module.scss";
import styles from "./left-sidebar.module.scss";
import { EditorLeftSidebarProps } from "./left-sidebar.props";
import EditorLeftSidebarSkeleton from "./skeleton";
import EditorStoryCard from "./story-card";
import EditorToc from "./toc";

const SuspendedEditorLeftSidebarContent = (
  props: EditorLeftSidebarProps
): React.ReactElement | null => {
  const { story } = props;
  const docStatus = useAtomValue(docStatusAtom);
  const isCollapsed = useAtomValue(sidebarsCollapsedAtom);
  const overflowingFigures = useAtomValue(overflowingFiguresAtom);
  const transitions = useTransition(!isCollapsed, {
    from: { opacity: 0, transform: "translate3d(-10%,0,0) scale(0.97)" },
    enter: { opacity: 1, transform: "translate3d(0%,0,0) scale(1)" },
    leave: { opacity: 0, transform: "translate3d(-10%,0,0) scale(0.97)" },
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
        {documentLoading ? (
          <EditorLeftSidebarSkeleton />
        ) : (
          <React.Fragment>
            <EditorStoryCard story={story} />
            <div className={clsx(styles.x, styles["padded-divider"])}>
              <Divider />
            </div>
            <EditorToc />
          </React.Fragment>
        )}
      </animated.div>
    ) : null
  );
};

export default SuspendedEditorLeftSidebarContent;
