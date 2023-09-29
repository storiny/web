import { clsx } from "clsx";
import React from "react";

import SplashScreen from "../../../../../../packages/ui/src/layout/splash-screen";

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
    <main>
      <Dropdown />
      <article className={clsx(styles.x, styles.article)}>{children}</article>
      <LegalFooter />
    </main>
    <RightSidebar />
    <SplashScreen />
  </>
);

export default LegalLayout;
