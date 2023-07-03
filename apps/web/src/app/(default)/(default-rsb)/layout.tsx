import React from "react";

import LeftSidebar from "~/layout/LeftSidebar";
import RightSidebar from "~/layout/RightSidebar";
import SplashScreen from "~/layout/SplashScreen";

const DefaultRightSidebarLayout = ({
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

export default DefaultRightSidebarLayout;
