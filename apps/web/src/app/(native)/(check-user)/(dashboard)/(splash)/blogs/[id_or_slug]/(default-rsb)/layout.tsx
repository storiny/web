import React from "react";

import Main from "~/components/main";

import DefaultDashboardRightSidebar from "../../../common/right-sidebar";

const DefaultBlogDashboardRightSidebarLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <>
    <Main>{children}</Main>
    <DefaultDashboardRightSidebar />
  </>
);

export default DefaultBlogDashboardRightSidebarLayout;
