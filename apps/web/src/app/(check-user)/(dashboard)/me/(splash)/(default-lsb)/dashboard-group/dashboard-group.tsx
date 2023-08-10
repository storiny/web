import { clsx } from "clsx";
import React from "react";

import { DashboardGroupProps } from "./dashboard-group.props";

const DashboardGroup = (props: DashboardGroupProps): React.ReactElement => {
  const { children, className, ...rest } = props;
  return (
    <div {...rest} className={clsx("flex-col", className)}>
      {children}
    </div>
  );
};

export default DashboardGroup;
