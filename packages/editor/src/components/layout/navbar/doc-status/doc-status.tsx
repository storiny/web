import clsx from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Tooltip from "~/components/tooltip";
import CloudIcon from "~/icons/cloud";
import CloudOffIcon from "~/icons/cloud-off";
import CloudSyncingIcon from "~/icons/cloud-syncing";

import { doc_status_atom, DocStatus as TDocStatus } from "../../../../atoms";
import styles from "./doc-status.module.scss";

type LocalDocStatus = Exclude<
  TDocStatus,
  "connected" | "overloaded" | "forbidden" | "publishing"
>;

const DOC_STATUS_TOOLTIP_MAP: Record<LocalDocStatus, string> = {
  connecting /*  */: "Connecting…",
  reconnecting /**/: "Reconnecting…",
  syncing /*     */: "Syncing…",
  disconnected /**/: "Disconnected"
};

const DOC_STATUS_ICON_MAP: Record<LocalDocStatus, React.ReactElement> = {
  connecting /*  */: <CloudIcon />,
  reconnecting /**/: <CloudSyncingIcon />,
  syncing /*     */: <CloudSyncingIcon />,
  disconnected /**/: <CloudOffIcon />
};

const DocStatus = (): React.ReactElement | null => {
  const doc_status = use_atom_value(doc_status_atom);

  if (
    ["publishing", "connected", "overloaded", "forbidden"].includes(doc_status)
  ) {
    return null;
  }

  return (
    <Tooltip content={DOC_STATUS_TOOLTIP_MAP[doc_status as LocalDocStatus]}>
      <span className={clsx("flex-center", styles.x, styles.icon)}>
        {DOC_STATUS_ICON_MAP[doc_status as LocalDocStatus]}
      </span>
    </Tooltip>
  );
};

export default DocStatus;
