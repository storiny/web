import { clsx } from "clsx";
import React from "react";

import Main from "~/components/main";
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
    <Main>{children}</Main>
    <Footer />
    <BottomNavigation />
  </div>
);

export default BrandingLayout;
