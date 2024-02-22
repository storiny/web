import { MOCK_BLOGS } from "@storiny/ui/src/mocks";
import { clsx } from "clsx";
import React from "react";

import BlogLeftSidebar from "~/layout/blog-left-sidebar";
import BlogNavbar from "~/layout/blog-navbar";
import BlogRightSidebar from "~/layout/blog-right-sidebar";
import SplashScreen from "~/layout/splash-screen";
import css from "~/theme/main.module.scss";

import BlogContext from "./context";

const BlogLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  //   TODO:
  <BlogContext.Provider value={{ ...MOCK_BLOGS[0], role: "owner" }}>
    <div
      className={clsx(css["grid"], css["grid-container"], css["no-sidenav"])}
    >
      <BlogNavbar />
      <BlogLeftSidebar />
      <main data-root={"true"}>{children}</main>
      <BlogRightSidebar />
      <SplashScreen />
    </div>
  </BlogContext.Provider>
);

export default BlogLayout;
