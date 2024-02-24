import React from "react";

import DashboardFooter from "./footer";
import DefaultDashboardLeftSidebar from "./left-sidebar";

const DefaultDashboardLeftSidebarLayout = ({
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

export default DefaultDashboardLeftSidebarLayout;
