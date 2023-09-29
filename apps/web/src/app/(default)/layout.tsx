import { clsx } from "clsx";
import React from "react";

import BottomNavigation from "../../../../../packages/ui/src/layout/bottom-navigation";
import Navbar from "../../../../../packages/ui/src/layout/navbar";
import Sidenav from "../../../../../packages/ui/src/layout/sidenav";

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
