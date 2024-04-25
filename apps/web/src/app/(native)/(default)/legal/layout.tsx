import React from "react";

import Main from "~/components/main";
import SplashScreen from "~/layout/splash-screen";

import Dropdown from "./dropdown";
import LegalFooter from "./footer";
import styles from "./layout.module.scss";
import LeftSidebar from "./left-sidebar";
import RightSidebar from "./right-sidebar";

const LegalLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <>
    <LeftSidebar />
    <Main>
      <Dropdown />
      <article className={styles.article}>{children}</article>
      <LegalFooter />
    </Main>
    <RightSidebar />
    <SplashScreen />
  </>
);

export default LegalLayout;
