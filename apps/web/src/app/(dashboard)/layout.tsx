import React from "react";

import Navbar from "~/layout/Navbar";
import SplashScreen from "~/layout/SplashScreen";

const DashboardLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={"grid"}>
    <Navbar />
    {children}
    <SplashScreen />
  </div>
);

export default DashboardLayout;
