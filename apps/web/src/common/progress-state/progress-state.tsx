import { useNProgress as use_n_progress } from "@tanem/react-nprogress";
import { clsx } from "clsx";
import React from "react";

import ProgressBar, { ProgressBarProps } from "~/components/progress-bar";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import styles from "./progress-state.module.scss";
import { ProgressStateProps } from "./progress-state.props";

const ProgressState = ({ label }: ProgressStateProps): React.ReactElement => {
  const { progress, animationDuration: animation_duration } = use_n_progress({
    isAnimating: true
  });

  return (
    <div
      className={clsx(css["flex-col"], css["flex-center"], styles.container)}
    >
      <Typography level={"body2"}>{label}</Typography>
      <ProgressBar
        className={styles.progress}
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
        value={progress * 100}
      />
    </div>
  );
};

export default ProgressState;
