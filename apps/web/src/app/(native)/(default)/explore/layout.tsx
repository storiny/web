import React from "react";

import Main from "~/components/main";
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
    <Main>{children}</Main>
    <RightSidebar />
    <SplashScreen />
  </>
);

export default ExploreLayout;
