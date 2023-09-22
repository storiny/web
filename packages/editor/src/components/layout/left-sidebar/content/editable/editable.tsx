import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Divider from "~/components/Divider";

import { docStatusAtom } from "../../../../../atoms";
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
  const docStatus = useAtomValue(docStatusAtom);
  const documentLoading =
    status !== "deleted" && ["connecting", "reconnecting"].includes(docStatus);

  if (documentLoading) {
    return <EditorLeftSidebarEditableContentSkeleton />;
  }

  return (
    <React.Fragment>
      <EditorStoryCard status={status} />
      <div className={clsx(styles.x, styles["padded-divider"])}>
        <Divider />
      </div>
      <EditorToc disabled={status === "deleted"} />
    </React.Fragment>
  );
};

export default SuspendedEditorLeftSidebarEditableContent;
