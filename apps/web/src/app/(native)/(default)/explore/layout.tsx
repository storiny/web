import React from "react";

import LeftSidebar from "~/layout/left-sidebar";
import SplashScreen from "~/layout/splash-screen";

import RightSidebar from "./right-sidebar";

const ExploreLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <>
    <LeftSidebar />
    <main data-root={"true"}>{children}</main>
    <RightSidebar />
    <SplashScreen />
  </>
);

export default ExploreLayout;
