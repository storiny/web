"use client";

import { useNProgress as use_n_progress } from "@tanem/react-nprogress";
import { clsx } from "clsx";
import React from "react";

import ProgressBar, { ProgressBarProps } from "~/components/progress-bar";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import styles from "./loader.module.scss";

const EditorLoader = ({
  label = "Loading document…",
  overlay,
  hide_progress,
  icon,
  action
}: {
  action?: React.ReactNode;
  hide_progress?: boolean;
  icon?: React.ReactNode;
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
      aria-label={typeof label === "string" ? label : "Loading…"}
      className={clsx(
        css["flex-col"],
        css["flex-center"],
        styles.loader,
        overlay && styles.overlay
      )}
      data-testid={"overlay"}
    >
      {icon}
      <Typography
        className={clsx(css["t-minor"], styles.x, styles.label)}
        level={"body2"}
      >
        {label}
      </Typography>
      {!hide_progress && (
        <ProgressBar
          className={clsx(styles.x, styles.progress)}
          max={100}
          slot_props={
            {
              indicator: {
                "data-force-animation": "",
                style: {
                  transition: `transform ${animation_duration}ms ease-out`
                }
              }
            } as ProgressBarProps["slot_props"]
          }
          value={is_finished && !loading ? 100 : progress * 100}
        />
      )}
      {Boolean(action) && (
        <React.Fragment>
          {/* This span acts as a spacer using to the `gap` property */}
          <span />
          {action}
        </React.Fragment>
      )}
    </div>
  );
};

export default EditorLoader;
