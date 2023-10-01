import { clsx } from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

import DashboardSplashLayout from "../(dashboard)/me/(splash)/layout";

const DashboardEditorLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div
    className={clsx(
      css["grid"],
      css["grid-container"],
      css["dashboard"],
      css["no-sidenav"]
    )}
  >
    <DashboardSplashLayout>{children}</DashboardSplashLayout>
  </div>
);

export default DashboardEditorLayout;
