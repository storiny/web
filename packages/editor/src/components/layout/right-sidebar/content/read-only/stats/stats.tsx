import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Button from "../../../../../../../../ui/src/components/button";
import Divider from "../../../../../../../../ui/src/components/divider";
import Separator from "../../../../../../../../ui/src/components/separator";
import Typography from "../../../../../../../../ui/src/components/typography";
import CommentIcon from "../../../../../../../../ui/src/icons/comment";
import { use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "../../../../../../../../ui/src/utils/abbreviate-number";

import { story_metadata_atom } from "../../../../../../atoms";
import LikeButton from "./like-button";
import styles from "./stats.module.scss";

const StoryStats = (): React.ReactElement => {
  const story = use_atom_value(story_metadata_atom);
  const read_count = story.stats.read_count + 1; // Also include the current reading session
  const comment_count =
    use_app_selector(
      (state) => state.entities.story_comment_counts[story.id]
    ) || 0;

  return (
    <div className={clsx("flex-col", styles.stats)}>
      <div className={styles["padded-separator"]}>
        <Separator />
      </div>
      <div className={clsx("flex-center", styles.main)}>
        <Typography
          className={"t-medium"}
          level={"body2"}
          title={`${read_count.toLocaleString()} ${
            read_count === 1 ? "read" : "reads"
          }`}
        >
          {abbreviate_number(read_count)} {read_count === 1 ? "read" : "reads"}
        </Typography>
        <div
          className={clsx("f-grow", "flex-center", styles["divider-wrapper"])}
        >
          <Divider orientation={"vertical"} />
        </div>
        <LikeButton />
        <Button
          aria-label={`Add a comment (${comment_count.toLocaleString()} ${
            comment_count === 1 ? "comment" : "comments"
          })`}
          decorator={<CommentIcon />}
          disabled={story.disable_comments}
          onClick={(): void => {
            document
              .getElementById("auxiliary-content")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          title={`Add a comment (${comment_count.toLocaleString()} ${
            comment_count === 1 ? "comment" : "comments"
          })`}
          variant={"hollow"}
        >
          {abbreviate_number(comment_count)}
        </Button>
      </div>
      <div className={styles["padded-separator"]}>
        <Separator />
      </div>
    </div>
  );
};

export default StoryStats;
