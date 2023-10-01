import { clsx } from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

import styles from "./dashboard-wrapper.module.scss";
import { DashboardWrapperProps } from "./dashboard-wrapper.props";

const DashboardWrapper = (props: DashboardWrapperProps): React.ReactElement => {
  const { children, className, ...rest } = props;
  return (
    <div
      {...rest}
      className={clsx(css["flex-col"], styles["dashboard-wrapper"], className)}
    >
      {children}
    </div>
  );
};

export default DashboardWrapper;
