"use client";

import { animated, useTransition } from "@react-spring/web";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import Typography from "~/components/Typography";

import {
  docStatusAtom,
  overflowingFiguresAtom,
  sidebarsCollapsedAtom
} from "../../../../atoms";
import { springConfig } from "../../../../constants";
import commonStyles from "../../common/sidebar.module.scss";
import styles from "../right-sidebar.module.scss";
import { EditorRightSidebarProps } from "../right-sidebar.props";

const SuspendedEditorRightSidebarEditableContent = dynamic(
  () => import("./editable"),
  { loading: dynamicLoader() }
);

const SuspendedEditorRightSidebarReadOnlyContent = dynamic(
  () => import("./read-only"),
  { loading: dynamicLoader() }
);

const SuspendedEditorRightSidebarContent = (
  props: EditorRightSidebarProps
): React.ReactElement | null => {
  const { readOnly, status } = props;
  const mountedRef = React.useRef<boolean>(false);
  const isCollapsed = useAtomValue(sidebarsCollapsedAtom);
  const docStatus = useAtomValue(docStatusAtom);
  const overflowingFigures = useAtomValue(overflowingFiguresAtom);
  const transitions = useTransition(!isCollapsed, {
    from: { opacity: 0, transform: "translate3d(10%,0,0) scale(0.97)" },
    enter: { opacity: 1, transform: "translate3d(0%,0,0) scale(1)" },
    leave: { opacity: 0, transform: "translate3d(10%,0,0) scale(0.97)" },
    config: springConfig,
    immediate: Boolean(readOnly) && !mountedRef.current
  });
  const documentLoading =
    !readOnly && ["connecting", "reconnecting"].includes(docStatus);
  const publishing = docStatus === "publishing";
  const disabled = documentLoading || publishing;

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
          pointerEvents: disabled ? "none" : "auto"
        }}
      >
        {readOnly ? (
          <SuspendedEditorRightSidebarReadOnlyContent />
        ) : status === "deleted" ? (
          <Typography className={"t-minor"} level={"body2"}>
            You are currently viewing a static version of this deleted story. If
            you do not restore it, the story will be permanently pruned within
            30 days from the date of deletion.
          </Typography>
        ) : (
          <SuspendedEditorRightSidebarEditableContent />
        )}
      </animated.div>
    ) : null
  );
};

export default SuspendedEditorRightSidebarContent;
