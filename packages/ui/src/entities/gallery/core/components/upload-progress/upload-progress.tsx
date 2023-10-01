import { useNProgress as use_n_progress } from "@tanem/react-nprogress";
import React from "react";

import ProgressBar, { ProgressBarProps } from "~/components/progress-bar";
import css from "~/theme/main.module.scss";

import styles from "./upload-progress.module.scss";

const UploadProgress = (): React.ReactElement => {
  const { progress, animationDuration: animation_duration } = use_n_progress({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    isAnimating: true
  });

  return (
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
  );
};

export default UploadProgress;
