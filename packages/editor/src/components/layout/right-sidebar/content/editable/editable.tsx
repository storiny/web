"use client";

import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Divider from "~/components/divider";
import css from "~/theme/main.module.scss";

import { DOC_STATUS, doc_status_atom } from "../../../../../atoms";
import Alignment from "./alignment";
import Appearance from "./appearance";
import History from "./history";
import Indentation from "./indentation";
import Insert from "./insert";
import PaddedDivider from "./padded-divider";
import TextStyle from "./text-style";

const SuspendedEditorRightSidebarEditableContent = (): React.ReactElement => {
  const doc_status = use_atom_value(doc_status_atom);
  const document_loading = [
    DOC_STATUS.connecting,
    DOC_STATUS.reconnecting
  ].includes(doc_status);
  const publishing = doc_status === DOC_STATUS.publishing;
  const disabled = document_loading || publishing;

  return (
    <React.Fragment>
      <div className={css["flex-center"]}>
        <History disabled={disabled} />
        <PaddedDivider />
        <Alignment disabled={disabled} />
        <PaddedDivider />
        <Indentation disabled={disabled} />
      </div>
      <Divider />
      <TextStyle disabled={disabled} />
      <Divider />
      <Insert disabled={disabled} />
      <Divider />
      <Appearance disabled={disabled} />
    </React.Fragment>
  );
};

export default SuspendedEditorRightSidebarEditableContent;
