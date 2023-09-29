import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Button from "../../../../../../../../ui/src/components/button";
import Divider from "../../../../../../../../ui/src/components/divider";
import Separator from "../../../../../../../../ui/src/components/separator";
import Typography from "../../../../../../../../ui/src/components/typography";
import CommentIcon from "~/icons/Comment";
import { use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "../../../../../../../../ui/src/utils/abbreviate-number";

import { storyMetadataAtom } from "../../../../../../atoms";
import LikeButton from "./like-button";
import styles from "./stats.module.scss";

const StoryStats = (): React.ReactElement => {
  const story = use_atom_value(storyMetadataAtom);
  const readCount = story.stats.read_count + 1; // Also include the current reading session
  const commentCount =
    use_app_selector((state) => state.entities.storyCommentCounts[story.id]) ||
    0;

  return (
    <div className={clsx("flex-col", styles.stats)}>
      <div className={styles["padded-separator"]}>
        <Separator />
      </div>
      <div className={clsx("flex-center", styles.main)}>
        <Typography
          className={"t-medium"}
          level={"body2"}
          title={`${readCount.toLocaleString()} ${
            readCount === 1 ? "read" : "reads"
          }`}
        >
          {abbreviate_number(readCount)} {readCount === 1 ? "read" : "reads"}
        </Typography>
        <div
          className={clsx("f-grow", "flex-center", styles["divider-wrapper"])}
        >
          <Divider orientation={"vertical"} />
        </div>
        <LikeButton />
        <Button
          aria-label={`Add a comment (${commentCount.toLocaleString()} ${
            commentCount === 1 ? "comment" : "comments"
          })`}
          decorator={<CommentIcon />}
          disabled={story.disable_comments}
          onClick={(): void => {
            document
              .getElementById("auxiliary-content")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          title={`Add a comment (${commentCount.toLocaleString()} ${
            commentCount === 1 ? "comment" : "comments"
          })`}
          variant={"hollow"}
        >
          {abbreviate_number(commentCount)}
        </Button>
      </div>
      <div className={styles["padded-separator"]}>
        <Separator />
      </div>
    </div>
  );
};

export default StoryStats;
