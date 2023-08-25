import { clsx } from "clsx";
import React from "react";

import DashboardSplashLayout from "../(dashboard)/me/(splash)/layout";

const DashboardEditorLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx("grid", "dashboard", "no-sidenav")}>
    <DashboardSplashLayout>{children}</DashboardSplashLayout>
  </div>
);

export default DashboardEditorLayout;
