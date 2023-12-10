import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Divider from "~/components/divider";

import { doc_status_atom } from "../../../../../atoms";
import { is_doc_loading } from "../../../../../utils/is-doc-loading";
import { StoryStatus } from "../../../../editor";
import styles from "../../left-sidebar.module.scss";
import EditorLeftSidebarEditableContentSkeleton from "./skeleton";
import EditorStoryCard from "./story-card";
import EditorToc from "./toc";

const SuspendedEditorLeftSidebarEditableContent = ({
  status
}: {
  status: StoryStatus;
}): React.ReactElement => {
  const doc_status = use_atom_value(doc_status_atom);
  const document_loading = status !== "deleted" && is_doc_loading(doc_status);

  if (document_loading) {
    return <EditorLeftSidebarEditableContentSkeleton />;
  }

  return (
    <React.Fragment>
      <EditorStoryCard status={status} />
      <div className={styles["padded-divider"]}>
        <Divider />
      </div>
      <EditorToc disabled={status === "deleted"} />
    </React.Fragment>
  );
};

export default SuspendedEditorLeftSidebarEditableContent;
