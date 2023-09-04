import { clsx } from "clsx";
import React from "react";

import BottomNavigation from "~/layout/BottomNavigation";
import Footer from "~/layout/Footer";
import Navbar from "~/layout/Navbar";

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
