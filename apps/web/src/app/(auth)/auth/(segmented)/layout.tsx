"use client";

import {
  animated,
  useSpring as use_spring,
  useTransition as use_transition
} from "@react-spring/web";
import React from "react";
import use_measure from "react-use-measure";

import { use_media_query } from "~/hooks/use-media-query";
import { use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../state";
import { AuthSegment } from "../../state";

/**
 * Switches parallel segments based on the state
 */
const SegmentedLayout = (
  props: Record<AuthSegment, React.ReactNode>
): React.ReactNode => {
  const { state } = use_auth_state();
  const reduced_motion = use_app_selector(
    (state) => state.preferences.reduced_motion
  );
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const should_animate =
    !is_smaller_than_mobile && reduced_motion !== "enabled";
  const has_computed_height_ref = React.useRef<boolean>(false);
  const container_ref = React.useRef<HTMLDivElement | null>(null);
  const enter_from_top =
    state.visited_segments[state.visited_segments.length - 1] !==
      state.segment || state.segment === "base";
  const [ref, { height }] = use_measure({ scroll: false });
  const [height_style, animate] = use_spring(
    () => ({
      height: "0px",
      config: { duration: 10, friction: 0 }
    }),
    []
  );
  const transitions = use_transition(state.segment, {
    immediate: !should_animate || !container_ref.current,
    from: {
      opacity: 0,
      transform: `translate3d(0,${
        enter_from_top ? "-100%" : "100%"
      },0) scaleY(0.9)`
    },
    enter: {
      opacity: 1,
      transform: `translate3d(0,0%,0) scaleY(1)`
    },
    leave: {
      opacity: 0,
      transform: `translate3d(0,${
        enter_from_top ? "100%" : "-100%"
      },0) scaleY(0.9)`,
      position: "absolute",
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      pointerEvents: "none",
      width: (container_ref.current?.offsetWidth || 0) + "px"
    }
  });

  React.useEffect(() => {
    if (should_animate && height) {
      has_computed_height_ref.current = true;

      animate({
        height: height + "px"
      });
    }
  }, [animate, height, should_animate]);

  React.useEffect(() => {
    // Remove the search parameters.
    window.history.replaceState({}, "", "/auth");
  }, []);

  return (
    <animated.div
      ref={container_ref}
      style={{
        position: "relative",
        height:
          !should_animate || !container_ref.current
            ? "100%"
            : !height || !has_computed_height_ref.current
              ? "fit-content"
              : height_style.height
      }}
    >
      {transitions((style, segment) => (
        <animated.div
          className={css["flex-col"]}
          ref={ref}
          style={{
            ...(container_ref.current ? style : {}),
            height:
              !should_animate || !container_ref.current ? "100%" : "fit-content"
          }}
        >
          {props[segment]}
        </animated.div>
      ))}
    </animated.div>
  );
};

export default SegmentedLayout;
