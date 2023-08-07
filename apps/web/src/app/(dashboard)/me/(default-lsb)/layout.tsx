import React from "react";

import DefaultDashboardLeftSidebar from "./left-sidebar";

const DefaultDashboardLeftSidebarLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <>
    <DefaultDashboardLeftSidebar />
    {children}
  </>
);

export default DefaultDashboardLeftSidebarLayout;
