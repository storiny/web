import { useNProgress as use_n_progress } from "@tanem/react-nprogress";
import React from "react";

import ProgressBar from "~/components/progress-bar";

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
      slot_props={{
        indicator: {
          className: "force-animation",
          style: {
            transition: `transform ${animation_duration}ms ease-out`
          }
        }
      }}
      value={progress * 100}
    />
  );
};

export default UploadProgress;
