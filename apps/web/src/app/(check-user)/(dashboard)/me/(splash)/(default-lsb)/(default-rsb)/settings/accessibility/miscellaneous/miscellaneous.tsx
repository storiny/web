import { clsx } from "clsx";
import React from "react";

import Spacer from "~/components/spacer";
import Switch from "~/components/switch";
import Typography from "~/components/typography";
import { toggle_haptic_feedback } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import DashboardGroup from "../../../../dashboard-group";
import styles from "./miscellaneous.module.scss";

const MiscellaneousPreferences = (): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const haptic_feedback = use_app_selector(
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
      <div className={clsx(css["flex-col"], styles["switch-container"])}>
        <div className={css["flex-center"]}>
          <Typography
            as={"label"}
            className={css["t-medium"]}
            htmlFor={"haptic_feedback"}
          >
            Enable haptic feedback
          </Typography>
          <Spacer className={css["f-grow"]} size={2} />
          <Switch
            checked={haptic_feedback}
            name={"haptic_feedback"}
            onCheckedChange={(next_checked): void => {
              dispatch(toggle_haptic_feedback(next_checked));
            }}
          />
        </div>
        <Typography className={css["t-minor"]} level={"body2"}>
          Provide a haptic feedback mechanism on supported devices, such as
          vibration on important actions. Kindly note that not all devices and
          browsers support this feature, for example, Safari on iOS.
        </Typography>
      </div>
    </DashboardGroup>
  );
};

export default MiscellaneousPreferences;
