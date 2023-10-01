"use client";

import { useNProgress as use_n_progress } from "@tanem/react-nprogress";
import { clsx } from "clsx";
import React from "react";

import ProgressBar from "~/components/progress-bar";
import Typography from "~/components/typography";

import styles from "./loader.module.scss";

const EditorLoader = ({
  label = "Loading document…",
  overlay,
  hide_progress
}: {
  hide_progress?: boolean;
  label?: React.ReactNode;
  overlay?: boolean;
}): React.ReactElement => {
  const [loading, set_loading] = React.useState<boolean>(true);
  const {
    progress,
    isFinished: is_finished,
    animationDuration: animation_duration
  } = use_n_progress({
    isAnimating: loading
  });

  React.useEffect(() => {
    set_loading(true);
    return () => set_loading(false);
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
      {!hide_progress && (
        <ProgressBar
          className={clsx(styles.x, styles.progress)}
          max={100}
          slot_props={{
            indicator: {
              className: "force-animation",
              style: {
                transition: `transform ${animation_duration}ms ease-out`
              }
            }
          }}
          value={is_finished && !loading ? 100 : progress * 100}
        />
      )}
    </div>
  );
};

export default EditorLoader;
