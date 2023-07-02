import "server-only";

import React from "react";

import LeftSidebar from "~/layout/LeftSidebar";
import SplashScreen from "~/layout/SplashScreen";

import RightSidebar from "./right-sidebar";

const ExploreLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <>
    <LeftSidebar />
    <main>{children}</main>
    <RightSidebar />
    <SplashScreen />
  </>
);

export default ExploreLayout;
