import { clsx } from "clsx";
import React from "react";

import InfoSquareIcon from "~/icons/info-square";
import XIcon from "~/icons/x";
import css from "~/theme/main.module.scss";

import styles from "./settings-alert.module.scss";
import { SettingsAlertProps } from "./settings-alert.props";

const SettingsAlert = (
  props: SettingsAlertProps
): React.ReactElement | null => {
  const { on_dismiss, children, className, ...rest } = props;
  return (
    <div {...rest} className={clsx(styles.alert, className)} role={"alert"}>
      <span className={clsx(css["flex-center"], styles.decorator)}>
        <InfoSquareIcon />
      </span>
      <span className={styles.description}>{children}</span>
      <span
        aria-label={"Dismiss"}
        className={clsx(css["flex-center"], styles.close)}
        onClick={(): void => {
          if (on_dismiss) {
            on_dismiss();
          }
        }}
        title={"Dismiss"}
      >
        <XIcon />
      </span>
    </div>
  );
};

export default SettingsAlert;
