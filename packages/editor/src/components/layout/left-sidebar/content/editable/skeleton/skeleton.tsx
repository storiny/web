import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/divider";
import Skeleton from "~/components/skeleton";
import Spacer from "~/components/spacer";

import styles from "../../../left-sidebar.module.scss";
import { EditorStoryCardSkeleton } from "../story-card";

const EditorLeftSidebarEditableContentSkeleton = (): React.ReactElement => (
  <React.Fragment>
    <EditorStoryCardSkeleton />
    <div className={clsx(styles.x, styles["padded-divider"])}>
      <Divider />
    </div>
    <div className={"flex-col"}>
      <Skeleton height={18} width={96} />
      <Spacer orientation={"vertical"} size={3} />
      <Skeleton className={"full-w"} height={180} />
    </div>
  </React.Fragment>
);

export default EditorLeftSidebarEditableContentSkeleton;
