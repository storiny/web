import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Separator from "~/components/Separator";
import Typography from "~/components/Typography";
import CommentIcon from "~/icons/Comment";
import HeartIcon from "~/icons/Heart";
import { setLikedStory } from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import { storyMetadataAtom } from "../../../../../../atoms";
import styles from "./stats.module.scss";

const StoryStats = (): React.ReactElement => {
  const story = useAtomValue(storyMetadataAtom);
  const dispatch = useAppDispatch();
  const likeCount =
    useAppSelector((state) => state.entities.storyLikeCounts[story.id]) || 0;
  const commentCount =
    useAppSelector((state) => state.entities.storyCommentCounts[story.id]) || 0;
  const isLiked = useAppSelector(
    (state) => state.entities.likedStories[story.id]
  );

  return (
    <div className={clsx("flex-col", styles.stats)}>
      <div className={styles["padded-separator"]}>
        <Separator />
      </div>
      <div className={clsx("flex-center", styles.main)}>
        <Typography
          className={"t-medium"}
          level={"body2"}
          title={`${story.stats.read_count.toLocaleString()} ${
            story.stats.read_count === 1 ? "read" : "reads"
          }`}
        >
          {abbreviateNumber(story.stats.read_count)}{" "}
          {story.stats.read_count === 1 ? "read" : "reads"}
        </Typography>
        <div
          className={clsx("f-grow", "flex-center", styles["divider-wrapper"])}
        >
          <Divider orientation={"vertical"} />
        </div>
        <Button
          aria-label={`${
            isLiked ? "Unlike" : "Like"
          } story (${likeCount.toLocaleString()} ${
            likeCount === 1 ? "like" : "likes"
          })`}
          decorator={
            <span className={clsx(styles.heart, isLiked && styles.active)}>
              <HeartIcon noStroke={isLiked} />
            </span>
          }
          onClick={(): void => {
            dispatch(setLikedStory([story.id]));
          }}
          title={`${
            isLiked ? "Unlike" : "Like"
          } story (${likeCount.toLocaleString()} ${
            likeCount === 1 ? "like" : "likes"
          })`}
          variant={"hollow"}
        >
          {abbreviateNumber(likeCount)}
        </Button>
        <Button
          aria-label={`Add a comment (${commentCount.toLocaleString()} ${
            commentCount === 1 ? "comment" : "comments"
          })`}
          decorator={<CommentIcon />}
          disabled={story.disable_comments}
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
