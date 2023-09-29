import { clsx } from "clsx";
import React from "react";

import Navbar from "../../../../../../packages/ui/src/layout/navbar";
import Sidenav from "../../../../../../packages/ui/src/layout/sidenav";

const DashboardLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx("grid", "grid-container", "dashboard")}>
    <Navbar />
    <Sidenav is_dashboard />
    {children}
  </div>
);

export default DashboardLayout;
