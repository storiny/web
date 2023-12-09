"use client";

import { animated, useTransition as use_transition } from "@react-spring/web";
import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import Grow from "~/components/grow";
import Separator from "~/components/separator";
import Typography from "~/components/typography";
import RightSidebarFooter from "~/layout/right-sidebar/footer";
import css from "~/theme/main.module.scss";

import {
  DOC_STATUS,
  doc_status_atom,
  DocStatus,
  overflowing_figures_atom,
  sidebars_collapsed_atom
} from "../../../../atoms";
import { SPRING_CONFIG } from "../../../../constants";
import { is_doc_editable } from "../../../../utils/is-doc-editable";
import common_styles from "../../common/sidebar.module.scss";
import styles from "../right-sidebar.module.scss";
import { EditorRightSidebarProps } from "../right-sidebar.props";

const SuspendedEditorRightSidebarEditableContent = dynamic(
  () => import("./editable"),
  { loading: dynamic_loader() }
);
const SuspendedEditorRightSidebarReadOnlyContent = dynamic(
  () => import("./read-only"),
  { loading: dynamic_loader() }
);

const SuspendedEditorRightSidebarContent = (
  props: EditorRightSidebarProps
): React.ReactElement | null => {
  const { read_only, status } = props;
  const mounted_ref = React.useRef<boolean>(false);
  const is_collapsed = use_atom_value(sidebars_collapsed_atom);
  const doc_status = use_atom_value(doc_status_atom);
  const overflowing_figures = use_atom_value(overflowing_figures_atom);
  const transitions = use_transition(!is_collapsed, {
    from: { opacity: 0, transform: "translate3d(10%,0,0) scale(0.97)" },
    enter: { opacity: 1, transform: "translate3d(0%,0,0) scale(1)" },
    leave: { opacity: 0, transform: "translate3d(10%,0,0) scale(0.97)" },
    config: SPRING_CONFIG,
    immediate: Boolean(read_only) && !mounted_ref.current
  });
  const document_loading =
    !read_only &&
    [DOC_STATUS.connecting, DOC_STATUS.reconnecting].includes(doc_status);
  const publishing = doc_status === DOC_STATUS.publishing;
  const disabled = document_loading || publishing;

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
      <animated.div
        aria-busy={document_loading}
        className={clsx(
          css["flex-col"],
          styles.x,
          styles.content,
          common_styles.x,
          common_styles.content
        )}
        data-hidden={String(Boolean(overflowing_figures.size))}
        style={{
          ...style,
          pointerEvents: disabled ? "none" : "auto"
        }}
      >
        {read_only ? (
          <React.Fragment>
            <SuspendedEditorRightSidebarReadOnlyContent />
            <Grow />
            <Separator />
            <RightSidebarFooter />
          </React.Fragment>
        ) : status === "deleted" ? (
          <Typography className={css["t-minor"]} level={"body2"}>
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
