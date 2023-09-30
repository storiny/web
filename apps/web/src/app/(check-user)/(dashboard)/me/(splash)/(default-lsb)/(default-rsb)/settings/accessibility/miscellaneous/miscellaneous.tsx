import { clsx } from "clsx";
import React from "react";

import Spacer from "../../../../../../../../../../../../../packages/ui/src/components/spacer";
import Switch from "../../../../../../../../../../../../../packages/ui/src/components/switch";
import Typography from "../../../../../../../../../../../../../packages/ui/src/components/typography";
import { toggle_haptic_feedback } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

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
      <div className={clsx("flex-col", styles["switch-container"])}>
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
              dispatch(toggle_haptic_feedback(newChecked));
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
