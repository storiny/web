import React from "react";

import DashboardFooter from "../common/footer";
import DefaultDashboardLeftSidebar from "./left-sidebar";

const DashboardLeftSidebarLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <>
    <DefaultDashboardLeftSidebar />
    {children}
    <DashboardFooter />
  </>
);

export default DashboardLeftSidebarLayout;
