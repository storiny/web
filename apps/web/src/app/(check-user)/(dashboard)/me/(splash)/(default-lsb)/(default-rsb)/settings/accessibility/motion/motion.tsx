import { clsx } from "clsx";
import React from "react";

import Radio from "~/components/Radio";
import RadioGroup from "~/components/RadioGroup";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import { setReducedMotion } from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";

import DashboardGroup from "../../../../dashboard-group";
import styles from "./motion.module.scss";

const MotionPreference = (): React.ReactElement => {
  const dispatch = useAppDispatch();
  const reduced_motion = useAppSelector(
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
      <Typography className={"t-minor"} level={"body2"}>
        Restrict the number and intensity of on-site animations, including live
        statistics, splash screens, and user-generated animated media.
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      <RadioGroup
        className={clsx(styles.x, styles["radio-group"])}
        onValueChange={(newValue): void => {
          dispatch(setReducedMotion(newValue as typeof reduced_motion));
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
