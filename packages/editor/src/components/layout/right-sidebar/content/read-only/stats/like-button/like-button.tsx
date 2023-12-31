import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Button from "~/components/button";
import HeartIcon from "~/icons/heart";
import { boolean_action } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "~/utils/abbreviate-number";

import { story_metadata_atom } from "../../../../../../../atoms";
import styles from "./like-button.module.scss";

const Heart = ({
  active,
  should_animate
}: {
  active: boolean;
  should_animate: boolean;
}): React.ReactElement => (
  <span
    className={clsx(styles.heart, active && styles.active)}
    data-animate={String(should_animate)}
  >
    <HeartIcon className={styles.icon} no_stroke={active} />
  </span>
);

const LikeButton = (): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const story = use_atom_value(story_metadata_atom);
  const should_animate_ref = React.useRef<boolean>(false);
  const like_count =
    use_app_selector((state) => state.entities.story_like_counts[story.id]) ||
    0;
  const is_liked = use_app_selector(
    (state) => state.entities.liked_stories[story.id]
  );

  return (
    <Button
      aria-label={`${
        is_liked ? "Unlike" : "Like"
      } story (${like_count.toLocaleString()} ${
        like_count === 1 ? "like" : "likes"
      })`}
      auto_size
      check_auth
      decorator={
        <Heart active={is_liked} should_animate={should_animate_ref.current} />
      }
      onClick={(): void => {
        should_animate_ref.current = true;
        dispatch(boolean_action("liked_stories", story.id));
      }}
      title={`${
        is_liked ? "Unlike" : "Like"
      } story (${like_count.toLocaleString()} ${
        like_count === 1 ? "like" : "likes"
      })`}
      variant={"hollow"}
    >
      {abbreviate_number(like_count)}
    </Button>
  );
};

export default LikeButton;
