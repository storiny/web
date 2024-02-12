import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Button from "~/components/button";
import Divider from "~/components/divider";
import Separator from "~/components/separator";
import Tooltip from "~/components/tooltip";
import Typography from "~/components/typography";
import Persona from "~/entities/persona";
import CommentIcon from "~/icons/comment";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import { story_metadata_atom } from "../../../../../../atoms";
import LikeButton from "./like-button";
import styles from "./stats.module.scss";

const StoryStats = (): React.ReactElement => {
  const story = use_atom_value(story_metadata_atom);
  const read_count = story.read_count + 1; // Also include the current reading session
  const comment_count =
    use_app_selector(
      (state) => state.entities.story_comment_counts[story.id]
    ) || 0;

  return (
    <div className={clsx(css["flex-col"], styles.stats)}>
      <div className={styles["padded-separator"]}>
        <Separator />
      </div>
      {story.contributors?.length ? (
        <React.Fragment>
          <div className={clsx(css["full-w"], css.flex)}>
            <Persona
              avatar={story.contributors.map((user) => ({
                alt: "",
                avatar_id: user.avatar_id,
                hex: user.avatar_hex,
                label: user.name,
                as: "a",
                href: `/${user.username}`,
                target: "_blank"
              }))}
              primary_text={`${story.contributors.length} ${
                story.contributors.length === 1 ? "contributor" : "contributors"
              }`}
              render_avatar={(avatar, index): React.ReactNode => (
                <Tooltip
                  content={story.contributors[index]?.name ?? "Unknown user"}
                >
                  {avatar}
                </Tooltip>
              )}
            />
          </div>
          <div className={styles["padded-separator"]}>
            <Separator />
          </div>
        </React.Fragment>
      ) : null}
      <div className={clsx(css["flex-center"], styles.main)}>
        <Typography
          className={css["t-medium"]}
          level={"body2"}
          title={`${read_count.toLocaleString()} ${
            read_count === 1 ? "read" : "reads"
          }`}
        >
          {abbreviate_number(read_count)} {read_count === 1 ? "read" : "reads"}
        </Typography>
        <div
          className={clsx(
            css["f-grow"],
            css["flex-center"],
            styles["divider-wrapper"]
          )}
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
