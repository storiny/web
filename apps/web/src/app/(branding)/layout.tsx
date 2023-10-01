import { clsx } from "clsx";
import React from "react";

import BottomNavigation from "~/layout/bottom-navigation";
import Footer from "~/layout/footer";
import Navbar from "~/layout/navbar";
import css from "~/theme/main.module.scss";

const BrandingLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx(css["grid"], css["grid-container"], css["minimal"])}>
    <Navbar variant={"minimal"}>Media Kit</Navbar>
    <main data-root={"true"}>{children}</main>
    <Footer />
    <BottomNavigation />
  </div>
);

export default BrandingLayout;
