import React from "react";

import LeftSidebar from "../../../../../../packages/ui/src/layout/left-sidebar";
import RightSidebar from "../../../../../../packages/ui/src/layout/right-sidebar";
import SplashScreen from "../../../../../../packages/ui/src/layout/splash-screen";

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
