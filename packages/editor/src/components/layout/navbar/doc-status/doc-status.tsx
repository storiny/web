import clsx from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Tooltip from "~/components/Tooltip";
import CloudIcon from "~/icons/cloud";
import CloudOffIcon from "~/icons/CloudOff";
import CloudSyncingIcon from "~/icons/CloudSyncing";

import { DocStatus as TDocStatus, docStatusAtom } from "../../../../atoms";
import styles from "./doc-status.module.scss";

type DocStatusWithoutConnected = Exclude<TDocStatus, "connected">;

const DOC_STATUS_TO_TOOLTIP_MAP: Record<DocStatusWithoutConnected, string> = {
  connecting /*  */: "Connecting…",
  reconnecting /**/: "Reconnecting…",
  syncing /*     */: "Syncing…",
  disconnected /**/: "Disconnected"
};

const DOC_STATUS_TO_ICON_MAP: Record<
  DocStatusWithoutConnected,
  React.ReactElement
> = {
  connecting /*  */: <CloudIcon />,
  reconnecting /**/: <CloudSyncingIcon />,
  syncing /*     */: <CloudSyncingIcon />,
  disconnected /**/: <CloudOffIcon />
};

const DocStatus = (): React.ReactElement | null => {
  const docStatus = useAtomValue(docStatusAtom);

  if (docStatus === "connected") {
    return null;
  }

  return (
    <Tooltip content={DOC_STATUS_TO_TOOLTIP_MAP[docStatus]}>
      <span className={clsx("flex-center", styles.x, styles.icon)}>
        {DOC_STATUS_TO_ICON_MAP[docStatus]}
      </span>
    </Tooltip>
  );
};

export default DocStatus;
