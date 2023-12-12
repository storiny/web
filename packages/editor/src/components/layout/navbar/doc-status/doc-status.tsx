import clsx from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Tooltip from "~/components/tooltip";
import CloudIcon from "~/icons/cloud";
import CloudOffIcon from "~/icons/cloud-off";
import CloudSyncingIcon from "~/icons/cloud-syncing";
import css from "~/theme/main.module.scss";

import {
  DOC_STATUS,
  doc_status_atom,
  DocStatus as TDocStatus
} from "../../../../atoms";
import styles from "./doc-status.module.scss";

const DOC_STATUS_TOOLTIP_MAP: Partial<Record<TDocStatus, string>> = {
  [DOC_STATUS.connecting /*   */]: "Connecting…",
  [DOC_STATUS.reconnecting /* */]: "Reconnecting…",
  [DOC_STATUS.syncing /*      */]: "Syncing…",
  [DOC_STATUS.doc_corrupted /**/]: "Document corrupted",
  [DOC_STATUS.disconnected ||
  DOC_STATUS.lifetime_exceeded ||
  DOC_STATUS.deleted ||
  DOC_STATUS.published ||
  DOC_STATUS.internal /*      */]: "Disconnected"
};

const DOC_STATUS_ICON_MAP: Partial<Record<TDocStatus, React.ReactElement>> = {
  [DOC_STATUS.connecting /*  */]: <CloudIcon />,
  [DOC_STATUS.reconnecting /**/]: <CloudSyncingIcon />,
  [DOC_STATUS.syncing /*     */]: <CloudSyncingIcon />,
  [DOC_STATUS.disconnected ||
  DOC_STATUS.doc_corrupted ||
  DOC_STATUS.lifetime_exceeded ||
  DOC_STATUS.deleted ||
  DOC_STATUS.published ||
  DOC_STATUS.internal /*      */]: <CloudOffIcon />
};

const DocStatus = (): React.ReactElement | null => {
  const doc_status = use_atom_value(doc_status_atom);

  if (!DOC_STATUS_ICON_MAP[doc_status]) {
    return null;
  }

  return (
    <Tooltip content={DOC_STATUS_TOOLTIP_MAP[doc_status]}>
      <span className={clsx(css["flex-center"], styles.icon)}>
        {DOC_STATUS_ICON_MAP[doc_status]}
      </span>
    </Tooltip>
  );
};

export default DocStatus;
