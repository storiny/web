import { clsx } from "clsx";
import React from "react";

import BottomNavigation from "../../../../../packages/ui/src/layout/bottom-navigation";
import Footer from "../../../../../packages/ui/src/layout/footer";
import Navbar from "../../../../../packages/ui/src/layout/navbar";

const BrandingLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx("grid", "grid-container", "minimal")}>
    <Navbar variant={"minimal"}>Media Kit</Navbar>
    <main>{children}</main>
    <Footer />
    <BottomNavigation />
  </div>
);

export default BrandingLayout;
