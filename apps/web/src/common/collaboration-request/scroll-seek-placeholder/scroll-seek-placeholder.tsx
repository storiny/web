"use client";

import React from "react";

import { VirtualizedCollaborationRequestListContext } from "~/common/collaboration-request/list/list-context";
import Divider from "~/components/divider";
import { CollaborationRequestSkeleton } from "~/entities/collaboration-request";
import css from "~/theme/main.module.scss";

const VirtualizedCollaborationRequestScrollSeekPlaceholder = React.memo(() => {
  const { skeleton_props } = React.useContext(
    VirtualizedCollaborationRequestListContext
  );
  return (
    <div className={css["flex-col"]}>
      <CollaborationRequestSkeleton {...skeleton_props} />
      <Divider style={{ marginInline: "var(--grid-compensation)" }} />
    </div>
  );
});

VirtualizedCollaborationRequestScrollSeekPlaceholder.displayName =
  "VirtualizedCollaborationRequestScrollSeekPlaceholder";

export default VirtualizedCollaborationRequestScrollSeekPlaceholder;
