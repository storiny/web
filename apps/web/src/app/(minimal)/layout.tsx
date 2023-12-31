import { clsx } from "clsx";
import React from "react";

import BottomNavigation from "~/layout/bottom-navigation";
import Navbar from "~/layout/navbar";
import css from "~/theme/main.module.scss";

const MinimalLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx(css["grid"], css["grid-container"], css["minimal"])}>
    <Navbar variant={"minimal"} />
    {children}
    <BottomNavigation />
  </div>
);

export default MinimalLayout;
