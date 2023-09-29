import { clsx } from "clsx";
import React from "react";

import BottomNavigation from "../../../../../packages/ui/src/layout/bottom-navigation";
import Navbar from "../../../../../packages/ui/src/layout/navbar";

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
