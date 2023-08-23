"use client";

import { animated, useTransition } from "@react-spring/web";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Divider from "~/components/Divider";

import { sidebarsCollapsedAtom } from "../atoms";
import { springConfig } from "../constants";
import styles from "./left-sidebar.module.scss";
import { EditorLeftSidebarProps } from "./left-sidebar.props";
import EditorStoryCard from "./story-card";
import EditorToc from "./toc";

const SuspendedEditorLeftSidebarContent = (
  props: EditorLeftSidebarProps
): React.ReactElement => {
  const { story } = props;
  const isCollapsed = useAtomValue(sidebarsCollapsedAtom);
  const transitions = useTransition(!isCollapsed, {
    from: { opacity: 0, transform: "translate3d(-10%,0,0) scale(0.97)" },
    enter: { opacity: 1, transform: "translate3d(0%,0,0) scale(1)" },
    leave: { opacity: 0, transform: "translate3d(-10%,0,0) scale(0.97)" },
    config: springConfig
  });

  return transitions((style, item) =>
    item ? (
      <animated.div
        className={clsx("flex-col", styles.x, styles.content)}
        style={style}
      >
        <EditorStoryCard story={story} />
        <div className={clsx(styles.x, styles["padded-divider"])}>
          <Divider />
        </div>
        <EditorToc />
      </animated.div>
    ) : null
  );
};

export default SuspendedEditorLeftSidebarContent;
