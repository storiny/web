import React from "react";

import LeftSidebar from "~/layout/left-sidebar";
import RightSidebar from "~/layout/right-sidebar";
import SplashScreen from "~/layout/splash-screen";

const DefaultRightSidebarLayout = ({
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

export default DefaultRightSidebarLayout;
