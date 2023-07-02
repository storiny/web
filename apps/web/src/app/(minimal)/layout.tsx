import { clsx } from "clsx";
import React from "react";

import BottomNavigation from "~/layout/BottomNavigation";
import Navbar from "~/layout/Navbar";

const MinimalLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx("grid", "minimal")}>
    <Navbar variant={"minimal"} />
    {children}
    <BottomNavigation />
  </div>
);

export default MinimalLayout;
