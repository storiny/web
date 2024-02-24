import { clsx } from "clsx";
import React from "react";

import Radio from "~/components/radio";
import RadioGroup from "~/components/radio-group";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { set_reduced_motion } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import DashboardGroup from "../../../../dashboard-group";
import styles from "./motion.module.scss";

const MotionPreference = (): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const reduced_motion = use_app_selector(
    (state) => state.preferences.reduced_motion
  );

  return (
    <DashboardGroup>
      <Typography as={"h2"} level={"h4"}>
        Motion
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      <Typography as={"h3"} level={"h6"}>
        Reduced motion
      </Typography>
      <Spacer orientation={"vertical"} />
      <Typography className={css["t-minor"]} level={"body2"}>
        Restrict the number and intensity of on-site animations, including live
        statistics, splash screens, and user-generated animated media.
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      <RadioGroup
        className={clsx(styles.x, styles["radio-group"])}
        onValueChange={(next_value): void => {
          dispatch(set_reduced_motion(next_value as typeof reduced_motion));
        }}
        value={reduced_motion}
      >
        <Radio label={"Sync with system"} value={"system"} />
        <Radio label={"Enabled"} value={"enabled"} />
        <Radio label={"Disabled"} value={"disabled"} />
      </RadioGroup>
    </DashboardGroup>
  );
};

export default MotionPreference;
