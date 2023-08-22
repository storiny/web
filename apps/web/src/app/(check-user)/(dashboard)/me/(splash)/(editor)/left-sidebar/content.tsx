"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/Divider";

import styles from "./left-sidebar.module.scss";
import { EditorLeftSidebarProps } from "./left-sidebar.props";
import EditorStoryCard from "./story-card";
import EditorToc from "./toc";

const SuspendedEditorLeftSidebarContent = (
  props: EditorLeftSidebarProps
): React.ReactElement => {
  const { story } = props;
  return (
    <div className={clsx("flex-col", styles.x, styles.content)}>
      <EditorStoryCard story={story} />
      <div className={clsx(styles.x, styles["padded-divider"])}>
        <Divider />
      </div>
      <EditorToc />
    </div>
  );
};

export default SuspendedEditorLeftSidebarContent;
