import React from "react";

import Main from "~/components/main";
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
    <Main>{children}</Main>
    <RightSidebar />
    <SplashScreen />
  </>
);

export default DefaultRightSidebarLayout;
