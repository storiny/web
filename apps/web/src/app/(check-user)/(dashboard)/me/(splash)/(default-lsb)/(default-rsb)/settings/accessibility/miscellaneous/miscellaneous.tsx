import { clsx } from "clsx";
import React from "react";

import Spacer from "~/components/Spacer";
import Switch from "~/components/Switch";
import Typography from "~/components/Typography";
import { toggleHapticFeedback } from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";

import DashboardGroup from "../../../../dashboard-group";
import styles from "./miscellaneous.module.scss";

const MiscellaneousPreferences = (): React.ReactElement => {
  const dispatch = useAppDispatch();
  const haptic_feedback = useAppSelector(
    (state) => state.preferences.haptic_feedback
  );

  return (
    <DashboardGroup>
      <Typography as={"h2"} level={"h4"}>
        Miscellaneous
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      <Typography as={"h3"} level={"h6"}>
        Haptic feedback
      </Typography>
      <Spacer orientation={"vertical"} />
      <div className={clsx("flex-col", styles.x, styles["switch-container"])}>
        <div className={"flex-center"}>
          <Typography
            as={"label"}
            className={"t-medium"}
            htmlFor={"haptic-feedback"}
          >
            Enable haptic feedback
          </Typography>
          <Spacer className={"f-grow"} size={2} />
          <Switch
            checked={haptic_feedback}
            name={"haptic-feedback"}
            onCheckedChange={(newChecked): void => {
              dispatch(toggleHapticFeedback(newChecked));
            }}
          />
        </div>
        <Typography className={"t-minor"} level={"body2"}>
          Provide a haptic feedback mechanism on supported devices, such as
          vibration on important actions. Kindly note that not all devices and
          browsers support this feature, for example, Safari on iOS.
        </Typography>
      </div>
    </DashboardGroup>
  );
};

export default MiscellaneousPreferences;
