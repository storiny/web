import React from "react";

import BottomNavigation from "~/layout/BottomNavigation";
import Footer from "~/layout/Footer";
import Navbar from "~/layout/Navbar";

const BrandingLayout = ({ children }: { children: React.ReactNode }) => (
  <div className={"grid minimal"}>
    <Navbar variant={"minimal"}>Media Kit</Navbar>
    <main>{children}</main>
    <Footer />
    <BottomNavigation />
  </div>
);

export default BrandingLayout;
