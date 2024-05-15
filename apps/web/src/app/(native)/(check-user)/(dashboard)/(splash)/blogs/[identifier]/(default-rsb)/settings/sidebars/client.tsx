"use client";

import React from "react";

import Divider from "~/components/divider";
import Spacer from "~/components/spacer";

import DashboardTitle from "../../../../../common/dashboard-title";
import DashboardWrapper from "../../../../../common/dashboard-wrapper";
import NavigationItems from "./navigation-items";
import RightSidebarItems from "./right-sidebar-items";

const BlogSidebarsClient = (): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle>Sidebars</DashboardTitle>
    <DashboardWrapper>
      <NavigationItems />
      <Divider />
      <RightSidebarItems />
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default BlogSidebarsClient;
