import { clsx } from "clsx";
import React from "react";

import Navbar from "~/layout/navbar";
import Sidenav from "~/layout/sidenav";
import css from "~/theme/main.module.scss";

const DashboardLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx(css["grid"], css["grid-container"], css["dashboard"])}>
    <Navbar />
    <Sidenav is_dashboard />
    {children}
  </div>
);

export default DashboardLayout;
