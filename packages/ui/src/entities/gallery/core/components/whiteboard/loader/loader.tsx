import { useNProgress as use_n_progress } from "@tanem/react-nprogress";
import clsx from "clsx";
import React from "react";

import ProgressBar, { ProgressBarProps } from "~/components/progress-bar";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import styles from "./loader.module.scss";

const WhiteboardLoader = (): React.ReactElement => {
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
    <div className={clsx(css["flex-col"], css["flex-center"])}>
      <Typography className={css["t-medium"]} level={"body3"}>
        Loading whiteboard…
      </Typography>
      <Spacer orientation={"vertical"} size={1.5} />
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
        value={is_finished && !loading ? 100 : progress * 100}
      />
    </div>
  );
};

export default WhiteboardLoader;
