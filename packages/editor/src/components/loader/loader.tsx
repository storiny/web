"use client";

import { useNProgress } from "@tanem/react-nprogress";
import { clsx } from "clsx";
import React from "react";

import ProgressBar from "~/components/ProgressBar";
import Typography from "~/components/Typography";

import styles from "./loader.module.scss";

const EditorLoader = (): React.ReactElement => {
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
      className={clsx("flex-col", "flex-center", styles.x, styles.loader)}
    >
      <Typography className={"t-minor"} level={"body2"}>
        Loading document…
      </Typography>
      <ProgressBar
        className={clsx(styles.x, styles.progress)}
        max={100}
        slotProps={{
          indicator: {
            style: {
              transition: `transform ${animationDuration}ms ease-out`
            }
          }
        }}
        value={isFinished && !loading ? 100 : progress * 100}
      />
    </div>
  );
};

export default EditorLoader;
