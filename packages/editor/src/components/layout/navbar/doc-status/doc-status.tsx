import clsx from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Tooltip from "../../../../../../ui/src/components/tooltip";
import CloudIcon from "~/icons/cloud";
import CloudOffIcon from "../../../../../../ui/src/icons/cloud-off";
import CloudSyncingIcon from "../../../../../../ui/src/icons/cloud-syncing";

import { DocStatus as TDocStatus, doc_status_atom } from "../../../../atoms";
import styles from "./doc-status.module.scss";

type DocStatusWithoutConnectedAndOverflow = Exclude<
  TDocStatus,
  "connected" | "overloaded"
>;

const DOC_STATUS_TOOLTIP_MAP: Record<
  DocStatusWithoutConnectedAndOverflow,
  string
> = {
  connecting /*  */: "Connecting…",
  reconnecting /**/: "Reconnecting…",
  syncing /*     */: "Syncing…",
  disconnected /**/: "Disconnected"
};

const DOC_STATUS_ICON_MAP: Record<
  DocStatusWithoutConnectedAndOverflow,
  React.ReactElement
> = {
  connecting /*  */: <CloudIcon />,
  reconnecting /**/: <CloudSyncingIcon />,
  syncing /*     */: <CloudSyncingIcon />,
  disconnected /**/: <CloudOffIcon />
};

const DocStatus = (): React.ReactElement | null => {
  const doc_status = use_atom_value(doc_status_atom);

  if (doc_status === "connected" || doc_status === "overloaded") {
    return null;
  }

  return (
    <Tooltip content={DOC_STATUS_TOOLTIP_MAP[doc_status]}>
      <span className={clsx("flex-center", styles.x, styles.icon)}>
        {DOC_STATUS_ICON_MAP[doc_status]}
      </span>
    </Tooltip>
  );
};

export default DocStatus;
