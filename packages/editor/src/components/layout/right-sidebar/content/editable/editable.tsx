"use client";

import { useAtomValue } from "jotai";
import React from "react";

import Divider from "~/components/Divider";

import { docStatusAtom } from "../../../../../atoms";
import Alignment from "./alignment";
import Appearance from "./appearance";
import History from "./history";
import Indentation from "./indentation";
import Insert from "./insert";
import PaddedDivider from "./padded-divider";
import TextStyle from "./text-style";

const SuspendedEditorRightSidebarEditableContent = (): React.ReactElement => {
  const docStatus = useAtomValue(docStatusAtom);
  const documentLoading = ["connecting", "reconnecting"].includes(docStatus);
  const publishing = docStatus === "publishing";
  const disabled = documentLoading || publishing;

  return (
    <React.Fragment>
      <div className={"flex-center"}>
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
