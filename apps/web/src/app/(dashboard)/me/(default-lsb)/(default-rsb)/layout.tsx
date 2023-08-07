import React from "react";

import DefaultDashboardRightSidebar from "./right-sidebar";

const DefaultDashboardRightSidebarLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <>
    <main>{children}</main>
    <DefaultDashboardRightSidebar />
  </>
);

export default DefaultDashboardRightSidebarLayout;
