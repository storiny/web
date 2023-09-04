import { clsx } from "clsx";
import React from "react";

import BottomNavigation from "~/layout/BottomNavigation";
import Navbar from "~/layout/Navbar";
import Sidenav from "~/layout/Sidenav";

const DefaultLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx("grid", "grid-container")}>
    <Navbar />
    <Sidenav />
    {children}
    <BottomNavigation />
  </div>
);

export default DefaultLayout;
