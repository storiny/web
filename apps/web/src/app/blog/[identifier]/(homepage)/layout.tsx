import { clsx } from "clsx";
import React from "react";

import Main from "~/components/main";
import BlogLeftSidebar from "~/layout/blog-left-sidebar";
import BlogNavbar from "~/layout/blog-navbar";
import BlogRightSidebar from "~/layout/blog-right-sidebar";
import SplashScreen from "~/layout/splash-screen";
import css from "~/theme/main.module.scss";

const BlogHomepageLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <React.Fragment>
    <div
      className={clsx(css["grid"], css["grid-container"], css["no-sidenav"])}
    >
      <BlogNavbar />
      <BlogLeftSidebar is_homepage />
      <Main>{children}</Main>
      <BlogRightSidebar is_homepage />
      <SplashScreen />
    </div>
  </React.Fragment>
);

export default BlogHomepageLayout;
