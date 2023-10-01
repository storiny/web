import { clsx } from "clsx";
import React from "react";

import InfoIcon from "~/icons/info";
import XIcon from "~/icons/x";

import styles from "./settings-alert.module.scss";
import { SettingsAlertProps } from "./settings-alert.props";

const SettingsAlert = (
  props: SettingsAlertProps
): React.ReactElement | null => {
  const { on_dismiss, children, className, ...rest } = props;
  return (
    <div {...rest} className={clsx(styles.alert, className)} role={"alert"}>
      <span className={clsx("flex-center", styles.decorator)}>
        <InfoIcon />
      </span>
      <span className={styles.description}>{children}</span>
      <span
        aria-label={"Dismiss"}
        className={clsx("flex-center", styles.close)}
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
