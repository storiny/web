import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Button from "../../../../../../../../../ui/src/components/button";
import HeartIcon from "../../../../../../../../../ui/src/icons/heart";
import { boolean_action } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "../../../../../../../../../ui/src/utils/abbreviate-number";

import { story_metadata_atom } from "../../../../../../../atoms";
import styles from "./like-button.module.scss";

const MAX_PARTICLES = 8;
const MIN_PARTICLES = 3;
const BUBBLE_DIA = parseFloat(styles.BUBBLE_DIA);
const SPARKLE_DIA = parseFloat(styles.SPARKLE_DIA);
const BUBBLE_RAD = BUBBLE_DIA / 2;
const SPARKLE_RAD = SPARKLE_DIA / 2;
const NUM_SPARKLES = 2;

/**
 * Generates heart sparkles
 * @param spread_factor Spread factor
 * @param group_count Number of sparkle groups
 */
const generate_sparkles = (
  spread_factor: number,
  group_count: number
): string => {
  const items: string[] = [];
  const group_base_angle = 360 / group_count;
  const group_distr_rad = (1 + spread_factor * 0.25) * BUBBLE_RAD;
  const sparkle_base_angle = 360 / NUM_SPARKLES;
  const sparkle_off_angle = 60;
  const spread_rad = -spread_factor * SPARKLE_RAD;

  for (let i = 0; i < group_count; i++) {
    const group_curr_angle = i * group_base_angle - 90;
    const x_group = group_distr_rad * Math.cos(group_curr_angle);
    const y_group = group_distr_rad * Math.sin(group_curr_angle);

    for (let j = 0; j < NUM_SPARKLES; j++) {
      const sparkle_curr_angle =
        group_curr_angle + sparkle_off_angle + j * sparkle_base_angle;
      const x_sparkle = x_group + SPARKLE_DIA * Math.cos(sparkle_curr_angle);
      const y_sparkle = y_group + SPARKLE_DIA * Math.sin(sparkle_curr_angle);

      items.push(
        `${x_sparkle.toFixed(3)}rem ${y_sparkle.toFixed(
          3
        )}rem 0 ${spread_rad.toFixed(3)}rem hsl(${
          (i + j) * group_base_angle
        }deg, 100%, 70%)`
      );
    }
  }

  return items.join(",");
};

const Heart = ({
  active,
  should_animate
}: {
  active: boolean;
  should_animate: boolean;
}): React.ReactElement => {
  const sparkles = React.useMemo(() => {
    const group_count = Math.floor(
      Math.random() * (MAX_PARTICLES - MIN_PARTICLES + 1) + MIN_PARTICLES
    );
    return [
      generate_sparkles(0, group_count),
      generate_sparkles(1, group_count)
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <span
      className={clsx(styles.heart, active && styles.active)}
      data-animate={String(should_animate)}
      style={
        {
          "--spread-none": sparkles[0],
          "--spread-active": sparkles[1]
        } as React.CSSProperties
      }
    >
      <HeartIcon className={styles.icon} no_stroke={active} />
    </span>
  );
};

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
