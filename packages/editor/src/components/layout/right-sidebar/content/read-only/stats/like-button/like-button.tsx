import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Button from "../../../../../../../../../ui/src/components/button";
import HeartIcon from "~/icons/Heart";
import { boolean_action, setLikedStory } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "../../../../../../../../../ui/src/utils/abbreviate-number";

import { storyMetadataAtom } from "../../../../../../../atoms";
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
 * @param spreadFactor Spread factor
 * @param groupCount Number of sparkle groups
 */
const generateSparkles = (spreadFactor: number, groupCount: number): string => {
  const items: string[] = [];
  const groupBaseAngle = 360 / groupCount;
  const groupDistrRad = (1 + spreadFactor * 0.25) * BUBBLE_RAD;
  const sparkleBaseAngle = 360 / NUM_SPARKLES;
  const sparkleOffAngle = 60;
  const spreadRad = -spreadFactor * SPARKLE_RAD;

  for (let i = 0; i < groupCount; i++) {
    const groupCurrAngle = i * groupBaseAngle - 90;
    const xGroup = groupDistrRad * Math.cos(groupCurrAngle);
    const yGroup = groupDistrRad * Math.sin(groupCurrAngle);

    for (let j = 0; j < NUM_SPARKLES; j++) {
      const sparkleCurrAngle =
        groupCurrAngle + sparkleOffAngle + j * sparkleBaseAngle;
      const xSparkle = xGroup + SPARKLE_DIA * Math.cos(sparkleCurrAngle);
      const ySparkle = yGroup + SPARKLE_DIA * Math.sin(sparkleCurrAngle);

      items.push(
        `${xSparkle.toFixed(3)}rem ${ySparkle.toFixed(
          3
        )}rem 0 ${spreadRad.toFixed(3)}rem hsl(${
          (i + j) * groupBaseAngle
        }deg, 100%, 70%)`
      );
    }
  }

  return items.join(",");
};

const Heart = ({
  active,
  shouldAnimate
}: {
  active: boolean;
  shouldAnimate: boolean;
}): React.ReactElement => {
  const sparkles = React.useMemo(() => {
    const groupCount = Math.floor(
      Math.random() * (MAX_PARTICLES - MIN_PARTICLES + 1) + MIN_PARTICLES
    );
    return [generateSparkles(0, groupCount), generateSparkles(1, groupCount)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <span
      className={clsx(styles.heart, active && styles.active)}
      data-animate={String(shouldAnimate)}
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
  const story = use_atom_value(storyMetadataAtom);
  const shouldAnimateRef = React.useRef<boolean>(false);
  const likeCount =
    use_app_selector((state) => state.entities.storyLikeCounts[story.id]) || 0;
  const isLiked = use_app_selector(
    (state) => state.entities.likedStories[story.id]
  );

  return (
    <Button
      aria-label={`${
        isLiked ? "Unlike" : "Like"
      } story (${likeCount.toLocaleString()} ${
        likeCount === 1 ? "like" : "likes"
      })`}
      auto_size
      check_auth
      decorator={
        <Heart active={isLiked} shouldAnimate={shouldAnimateRef.current} />
      }
      onClick={(): void => {
        shouldAnimateRef.current = true;
        dispatch(boolean_action("liked_stories", story.id));
      }}
      title={`${
        isLiked ? "Unlike" : "Like"
      } story (${likeCount.toLocaleString()} ${
        likeCount === 1 ? "like" : "likes"
      })`}
      variant={"hollow"}
    >
      {abbreviate_number(likeCount)}
    </Button>
  );
};

export default LikeButton;
