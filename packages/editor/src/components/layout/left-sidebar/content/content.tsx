"use client";

import { animated, useTransition } from "@react-spring/web";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import LeftSidebarDefaultContent from "~/layout/LeftSidebar/DefaultContent";

import {
  docStatusAtom,
  overflowingFiguresAtom,
  sidebarsCollapsedAtom
} from "../../../../atoms";
import { springConfig } from "../../../../constants";
import commonStyles from "../../common/sidebar.module.scss";
import styles from "../left-sidebar.module.scss";
import { EditorLeftSidebarProps } from "../left-sidebar.props";

const SuspendedEditorLeftSidebarEditableContent = dynamic(
  () => import("./editable"),
  {
    loading: dynamicLoader()
  }
);

const SuspendedEditorLeftSidebarContent = (
  props: EditorLeftSidebarProps
): React.ReactElement | null => {
  const { readOnly, status } = props;
  const mountedRef = React.useRef<boolean>(false);
  const docStatus = useAtomValue(docStatusAtom);
  const isCollapsed = useAtomValue(sidebarsCollapsedAtom);
  const overflowingFigures = useAtomValue(overflowingFiguresAtom);
  const transitions = useTransition(!isCollapsed, {
    from: { opacity: 0, transform: "translate3d(-10%,0,0) scale(0.97)" },
    enter: { opacity: 1, transform: "translate3d(0%,0,0) scale(1)" },
    leave: { opacity: 0, transform: "translate3d(-10%,0,0) scale(0.97)" },
    config: springConfig,
    immediate: Boolean(readOnly) && !mountedRef.current
  });
  const documentLoading =
    !readOnly &&
    status !== "deleted" &&
    ["connecting", "reconnecting"].includes(docStatus);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (
    !readOnly &&
    (docStatus === "disconnected" ||
      docStatus === "forbidden" ||
      docStatus === "overloaded")
  ) {
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
        {readOnly ? (
          <LeftSidebarDefaultContent />
        ) : (
          <SuspendedEditorLeftSidebarEditableContent status={status} />
        )}
      </animated.div>
    ) : null
  );
};

export default SuspendedEditorLeftSidebarContent;
