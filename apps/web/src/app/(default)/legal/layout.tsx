import "server-only";

import React from "react";

import SplashScreen from "~/layout/SplashScreen";

import Dropdown from "./dropdown";
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
    <main>
      <Dropdown />
      <article className={styles.article}>{children}</article>
    </main>
    <RightSidebar />
    <SplashScreen />
  </>
);

export default LegalLayout;
