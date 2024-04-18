import { clsx } from "clsx";
import React from "react";

import Navbar from "~/layout/navbar";
import SplashScreen from "~/layout/splash-screen";
import css from "~/theme/main.module.scss";

import auth_styles from "../../../(native)/(auth)/layout.module.scss";

const BlogNewsletterLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <React.Fragment>
    <div className={clsx(css["grid"], css["grid-container"], css.minimal)}>
      <Navbar variant={"minimal"} />
      {/* Need to make the <main /> styles more specific */}
      <main
        className={clsx(auth_styles.x, auth_styles.main)}
        data-root={"true"}
      >
        <div className={clsx(css["flex-col"], auth_styles.container)}>
          {children}
        </div>
      </main>
      <SplashScreen />
    </div>
  </React.Fragment>
);

export default BlogNewsletterLayout;
