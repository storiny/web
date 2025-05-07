"use client";

import { animated, useTransition as use_transition } from "@react-spring/web";
import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import LeftSidebarDefaultContent from "~/layout/left-sidebar/default-content";
import css from "~/theme/main.module.scss";

import {
  DOC_STATUS,
  doc_status_atom,
  overflowing_figures_atom,
  sidebars_collapsed_atom
} from "../../../../atoms";
import { SPRING_CONFIG } from "../../../../constants";
import { is_doc_editable } from "../../../../utils/is-doc-editable";
import common_styles from "../../common/sidebar.module.scss";
import styles from "../left-sidebar.module.scss";
import { EditorLeftSidebarProps } from "../left-sidebar.props";

const SuspendedEditorLeftSidebarEditableContent = dynamic(
  () => import("./editable"),
  {
    loading: dynamic_loader()
  }
);

const SuspendedEditorLeftSidebarContent = (
  props: EditorLeftSidebarProps
): React.ReactElement | null => {
  const { read_only, status } = props;
  const mounted_ref = React.useRef<boolean>(false);
  const doc_status = use_atom_value(doc_status_atom);
  const is_collapsed = use_atom_value(sidebars_collapsed_atom);
  const overflowing_figures = use_atom_value(overflowing_figures_atom);
  const transitions = use_transition(!is_collapsed, {
    from: { opacity: 0, transform: "translate3d(-10%,0,0) scale(0.97)" },
    enter: { opacity: 1, transform: "translate3d(0%,0,0) scale(1)" },
    leave: { opacity: 0, transform: "translate3d(-10%,0,0) scale(0.97)" },
    config: SPRING_CONFIG,
    immediate: Boolean(read_only) && !mounted_ref.current
  });
  const document_loading =
    !read_only &&
    status !== "deleted" &&
    [DOC_STATUS.connecting, DOC_STATUS.reconnecting].includes(doc_status);

  React.useEffect(() => {
    mounted_ref.current = true;
    return () => {
      mounted_ref.current = false;
    };
  }, []);

  if (!read_only && !is_doc_editable(doc_status)) {
    return null;
  }

  return transitions((style, item) =>
    item ? (
      // @ts-expect-error https://github.com/pmndrs/react-spring/issues/2341
      <animated.div
        aria-busy={document_loading}
        className={clsx(
          css["flex-col"],
          styles.x,
          styles.content,
          common_styles.x,
          common_styles.content,
          read_only && styles["read-only"]
        )}
        data-hidden={String(Boolean(overflowing_figures.size))}
        style={{
          ...style,
          pointerEvents: document_loading ? "none" : "auto"
        }}
      >
        {read_only ? (
          <LeftSidebarDefaultContent />
        ) : (
          <SuspendedEditorLeftSidebarEditableContent status={status} />
        )}
      </animated.div>
    ) : null
  );
};

export default SuspendedEditorLeftSidebarContent;
