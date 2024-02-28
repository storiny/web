import React from "react";

import DefaultDashboardRightSidebar from "../../../common/right-sidebar";

const DefaultBlogDashboardRightSidebarLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <>
    <main data-root={"true"}>{children}</main>
    <DefaultDashboardRightSidebar />
  </>
);

export default DefaultBlogDashboardRightSidebarLayout;
