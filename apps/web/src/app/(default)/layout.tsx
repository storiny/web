import React from "react";

import BottomNavigation from "~/layout/BottomNavigation";
import Navbar from "~/layout/Navbar";
import Sidenav from "~/layout/Sidenav";

const DefaultLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={"grid"}>
    <Navbar />
    <Sidenav />
    {children}
    <BottomNavigation />
  </div>
);

export default DefaultLayout;
