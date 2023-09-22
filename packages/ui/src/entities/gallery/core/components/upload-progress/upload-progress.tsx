import { useNProgress } from "@tanem/react-nprogress";
import React from "react";

import ProgressBar from "~/components/ProgressBar";

import styles from "./upload-progress.module.scss";

const UploadProgress = (): React.ReactElement => {
  const { progress, animationDuration } = useNProgress({
    isAnimating: true
  });

  return (
    <ProgressBar
      className={styles.progress}
      max={100}
      slotProps={{
        indicator: {
          className: "force-animation",
          style: {
            transition: `transform ${animationDuration}ms ease-out`
          }
        }
      }}
      value={progress * 100}
    />
  );
};

export default UploadProgress;
