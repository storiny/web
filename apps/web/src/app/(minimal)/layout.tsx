import { clsx } from "clsx";
import React from "react";

import BottomNavigation from "~/layout/bottom-navigation";
import Navbar from "~/layout/navbar";

const MinimalLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx("grid", "grid-container", "minimal")}>
    <Navbar variant={"minimal"} />
    {children}
    <BottomNavigation />
  </div>
);

export default MinimalLayout;
