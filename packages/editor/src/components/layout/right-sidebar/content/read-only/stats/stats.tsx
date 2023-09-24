import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Separator from "~/components/Separator";
import Typography from "~/components/Typography";
import CommentIcon from "~/icons/Comment";
import { useAppSelector } from "~/redux/hooks";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import { storyMetadataAtom } from "../../../../../../atoms";
import LikeButton from "./like-button";
import styles from "./stats.module.scss";

const StoryStats = (): React.ReactElement => {
  const story = useAtomValue(storyMetadataAtom);
  const readCount = story.stats.read_count + 1; // Also include the current reading session
  const commentCount =
    useAppSelector((state) => state.entities.storyCommentCounts[story.id]) || 0;

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
          {abbreviateNumber(readCount)} {readCount === 1 ? "read" : "reads"}
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
          {abbreviateNumber(commentCount)}
        </Button>
      </div>
      <div className={styles["padded-separator"]}>
        <Separator />
      </div>
    </div>
  );
};

export default StoryStats;
