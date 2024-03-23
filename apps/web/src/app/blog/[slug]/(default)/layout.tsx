import { clsx } from "clsx";
import React from "react";

import BlogLeftSidebar from "~/layout/blog-left-sidebar";
import BlogNavbar from "~/layout/blog-navbar";
import SplashScreen from "~/layout/splash-screen";
import css from "~/theme/main.module.scss";

const DefaultBlogLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <React.Fragment>
    <div
      className={clsx(css["grid"], css["grid-container"], css["no-sidenav"])}
    >
      <BlogNavbar />
      <BlogLeftSidebar />
      {children}
      <SplashScreen />
    </div>
  </React.Fragment>
);

export default DefaultBlogLayout;
