import { clsx } from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

import { DashboardGroupProps } from "./dashboard-group.props";

const DashboardGroup = (props: DashboardGroupProps): React.ReactElement => {
  const { children, className, ...rest } = props;
  return (
    <div {...rest} className={clsx(css["flex-col"], className)}>
      {children}
    </div>
  );
};

export default DashboardGroup;
