"use client";

import clsx from "clsx";
import React from "react";

import Logo from "~/brand/Logo";

import styles from "./SplashScreen.module.scss";
import { SplashScreenProps } from "./SplashScreen.props";

const SplashScreen = (props: SplashScreenProps): React.ReactElement | null => {
  const { className, forceMount, children, ...rest } = props;
  const [visible, setVisible] = React.useState<boolean>(true);

  React.useEffect(() => {
    setVisible(false);
  }, []);

  if (!visible && !forceMount) {
    return null;
  }

  return (
    <div
      {...rest}
      aria-label={"Loading…"}
      className={clsx("flex-col", styles["splash-screen"], className)}
    >
      <Logo size={64} />
      {children && (
        <div className={clsx("flex-col", styles.children)}>{children}</div>
      )}
    </div>
  );
};

export default SplashScreen;
