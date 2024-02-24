import { clsx } from "clsx";
import React from "react";

import Spacer from "~/components/spacer";
import Switch from "~/components/switch";
import Typography from "~/components/typography";
import { toggle_code_gutters, toggle_code_wrapping } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import styles from "../code-block-preference.module.scss";

const CodeBlockSettings = (): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const enable_code_wrapping = use_app_selector(
    (state) => state.preferences.enable_code_wrapping
  );
  const enable_code_gutters = use_app_selector(
    (state) => state.preferences.enable_code_gutters
  );

  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Settings
      </Typography>
      <Spacer orientation={"vertical"} />
      <Typography className={css["t-minor"]} level={"body2"}>
        Settings for code blocks rendered inside stories.
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      <div className={clsx(css["flex-col"], styles["switch-container"])}>
        <div className={css["flex-center"]}>
          <Typography
            as={"label"}
            className={css["t-medium"]}
            htmlFor={"code_gutters"}
          >
            Show line numbers
          </Typography>
          <Spacer className={css["f-grow"]} size={2} />
          <Switch
            checked={enable_code_gutters}
            name={"code_gutters"}
            onCheckedChange={(next_checked): void => {
              dispatch(toggle_code_gutters(next_checked));
            }}
          />
        </div>
        <Typography className={css["t-minor"]} level={"body2"}>
          Show line numbers and other line-specific markers on the left edge of
          the code block.
        </Typography>
      </div>
      <Spacer orientation={"vertical"} size={3} />
      <div className={clsx(css["flex-col"], styles["switch-container"])}>
        <div className={css["flex-center"]}>
          <Typography
            as={"label"}
            className={css["t-medium"]}
            htmlFor={"wrapping"}
          >
            Wrap long lines
          </Typography>
          <Spacer className={css["f-grow"]} size={2} />
          <Switch
            checked={enable_code_wrapping}
            name={"wrapping"}
            onCheckedChange={(next_checked): void => {
              dispatch(toggle_code_wrapping(next_checked));
            }}
          />
        </div>
        <Typography className={css["t-minor"]} level={"body2"}>
          Wrap long lines inside the code blocks by default. This can be toggled
          individually for a code block.
        </Typography>
      </div>
    </React.Fragment>
  );
};

export default CodeBlockSettings;
