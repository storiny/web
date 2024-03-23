import React from "react";

import DefaultDashboardRightSidebar from "../../common/right-sidebar";

const DefaultDashboardRightSidebarLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <>
    <main data-root={"true"}>{children}</main>
    <DefaultDashboardRightSidebar />
  </>
);

export default DefaultDashboardRightSidebarLayout;
