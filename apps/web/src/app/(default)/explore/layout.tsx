import React from "react";

import LeftSidebar from "../../../../../../packages/ui/src/layout/left-sidebar";
import SplashScreen from "../../../../../../packages/ui/src/layout/splash-screen";

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
