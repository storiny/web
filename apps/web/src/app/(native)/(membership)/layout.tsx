import { clsx } from "clsx";
import React from "react";

import Main from "~/components/main";
import BottomNavigation from "~/layout/bottom-navigation";
import Footer from "~/layout/footer";
import Navbar from "~/layout/navbar";
import css from "~/theme/main.module.scss";

import MembershipNotice from "./membership/notice";

const MembershipLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx(css["grid"], css["grid-container"], css["minimal"])}>
    <Navbar variant={"minimal"}>Plus</Navbar>
    <Main>{children}</Main>
    <Footer>
      <MembershipNotice />
    </Footer>
    <BottomNavigation />
  </div>
);

export default MembershipLayout;
