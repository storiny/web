import { clsx } from "clsx";
import React from "react";

import Navbar from "~/layout/Navbar";
import Sidenav from "~/layout/Sidenav";

const DashboardLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx("grid", "grid-container", "dashboard")}>
    <Navbar />
    <Sidenav isDashboard />
    {children}
  </div>
);

export default DashboardLayout;
