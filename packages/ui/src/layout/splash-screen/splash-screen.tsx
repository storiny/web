"use client";

import { animated, useTransition as use_transition } from "@react-spring/web";
import clsx from "clsx";
import React from "react";

import Logo from "~/brand/logo";
import css from "~/theme/main.module.scss";

import styles from "./splash-screen.module.scss";
import { SplashScreenProps } from "./splash-screen.props";

const SplashScreen = (props: SplashScreenProps): React.ReactElement | null => {
  const {
    className,
    style: style_prop,
    force_mount,
    children,
    ...rest
  } = props;
  const [visible, set_visible] = React.useState<boolean>(true);
  const [transitions, api] = use_transition(visible, () => ({
    from: { opacity: 1, transform: "scale(1)" },
    enter: { opacity: 1, transform: "scale(1)" },
    leave: { opacity: 0, transform: "scale(1.175)" }
  }));

  React.useLayoutEffect(() => {
    set_visible(false);

    if (!force_mount) {
      setTimeout(api.start);
    }
  }, [api, force_mount]);

  return transitions(
    (style, show) =>
      show && (
        <animated.div
          {...rest}
          aria-label={"Loading…"}
          className={clsx(css["flex-col"], styles["splash-screen"], className)}
          style={{ ...style_prop, ...style }}
        >
          <Logo size={64} />
          {children && (
            <div className={clsx(css["flex-col"], styles.children)}>
              {children}
            </div>
          )}
        </animated.div>
      )
  );
};

export default SplashScreen;
