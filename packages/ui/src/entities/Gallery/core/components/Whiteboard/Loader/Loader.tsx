import { useNProgress } from "@tanem/react-nprogress";
import clsx from "clsx";
import React from "react";

import ProgressBar from "~/components/ProgressBar";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

import styles from "./Loader.module.scss";

const WhiteboardLoader = (): React.ReactElement => {
  const [loading, setLoading] = React.useState<boolean>(true);
  const { progress, isFinished, animationDuration } = useNProgress({
    isAnimating: loading
  });

  React.useEffect(() => {
    setLoading(true);
    return () => setLoading(false);
  }, []);

  return (
    <div className={clsx("flex-col", "flex-center")}>
      <Typography className={"t-medium"} level={"body3"}>
        Loading whiteboard...
      </Typography>
      <Spacer orientation={"vertical"} size={1.5} />
      <ProgressBar
        className={styles.progress}
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

export default WhiteboardLoader;
