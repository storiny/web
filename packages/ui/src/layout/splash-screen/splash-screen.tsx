"use client";

import clsx from "clsx";
import React from "react";

import Logo from "~/brand/logo";
import css from "~/theme/main.module.scss";

import styles from "./splash-screen.module.scss";
import { SplashScreenProps } from "./splash-screen.props";

const SplashScreen = (props: SplashScreenProps): React.ReactElement | null => {
  const { className, force_mount, hide_logo, children, ...rest } = props;
  const [visible, set_visible] = React.useState<boolean>(true);

  React.useLayoutEffect(() => {
    set_visible(false);
  }, []);

  if (!visible && !force_mount) {
    return null;
  }

  return (
    <div
      {...rest}
      aria-label={"Loading…"}
      className={clsx(css["flex-col"], styles["splash-screen"], className)}
    >
      {!hide_logo && <Logo size={64} />}
      {children && (
        <div className={clsx(css["flex-col"], styles.children)}>{children}</div>
      )}
    </div>
  );
};

export default SplashScreen;
