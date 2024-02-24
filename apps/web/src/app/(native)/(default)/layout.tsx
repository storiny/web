import { clsx } from "clsx";
import React from "react";

import BottomNavigation from "~/layout/bottom-navigation";
import Navbar from "~/layout/navbar";
import Sidenav from "~/layout/sidenav";
import css from "~/theme/main.module.scss";

const DefaultLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx(css["grid"], css["grid-container"])}>
    <Navbar />
    <Sidenav />
    {children}
    <BottomNavigation />
  </div>
);

export default DefaultLayout;
