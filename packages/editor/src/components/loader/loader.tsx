"use client";

import { useNProgress as use_n_progress } from "@tanem/react-nprogress";
import { clsx } from "clsx";
import React from "react";

import ProgressBar from "../../../../ui/src/components/progress-bar";
import Typography from "../../../../ui/src/components/typography";

import styles from "./loader.module.scss";

const EditorLoader = ({
  label = "Loading document…",
  overlay,
  hideProgress
}: {
  hideProgress?: boolean;
  label?: React.ReactNode;
  overlay?: boolean;
}): React.ReactElement => {
  const [loading, setLoading] = React.useState<boolean>(true);
  const { progress, isFinished, animationDuration } = useNProgress({
    isAnimating: loading
  });

  React.useEffect(() => {
    setLoading(true);
    return () => setLoading(false);
  }, []);

  return (
    <div
      aria-label={"Loading…"}
      className={clsx(
        "flex-col",
        "flex-center",
        styles.x,
        styles.loader,
        overlay && styles.overlay
      )}
      data-testid={"overlay"}
    >
      <Typography className={"t-minor"} level={"body2"}>
        {label}
      </Typography>
      {!hideProgress && (
        <ProgressBar
          className={clsx(styles.x, styles.progress)}
          max={100}
          slot_props={{
            indicator: {
              className: "force-animation",
              style: {
                transition: `transform ${animationDuration}ms ease-out`
              }
            }
          }}
          value={isFinished && !loading ? 100 : progress * 100}
        />
      )}
    </div>
  );
};

export default EditorLoader;
