import clsx from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Tooltip from "../../../../../../ui/src/components/tooltip";
import CloudIcon from "~/icons/cloud";
import CloudOffIcon from "~/icons/CloudOff";
import CloudSyncingIcon from "~/icons/CloudSyncing";

import { DocStatus as TDocStatus, docStatusAtom } from "../../../../atoms";
import styles from "./doc-status.module.scss";

type DocStatusWithoutConnectedAndOverflow = Exclude<
  TDocStatus,
  "connected" | "overloaded"
>;

const DOC_STATUS_TO_TOOLTIP_MAP: Record<
  DocStatusWithoutConnectedAndOverflow,
  string
> = {
  connecting /*  */: "Connecting…",
  reconnecting /**/: "Reconnecting…",
  syncing /*     */: "Syncing…",
  disconnected /**/: "Disconnected"
};

const DOC_STATUS_TO_ICON_MAP: Record<
  DocStatusWithoutConnectedAndOverflow,
  React.ReactElement
> = {
  connecting /*  */: <CloudIcon />,
  reconnecting /**/: <CloudSyncingIcon />,
  syncing /*     */: <CloudSyncingIcon />,
  disconnected /**/: <CloudOffIcon />
};

const DocStatus = (): React.ReactElement | null => {
  const docStatus = use_atom_value(docStatusAtom);

  if (docStatus === "connected" || docStatus === "overloaded") {
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
