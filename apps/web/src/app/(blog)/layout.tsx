import { MOCK_BLOGS } from "@storiny/ui/src/mocks";
import { clsx } from "clsx";
import React from "react";

import BlogNavbar from "~/layout/blog-navbar";
import LeftSidebar from "~/layout/left-sidebar";
import RightSidebar from "~/layout/right-sidebar";
import SplashScreen from "~/layout/splash-screen";
import css from "~/theme/main.module.scss";

import BlogContext from "./context";

const BlogLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  //   TODO:
  <BlogContext.Provider value={{ ...MOCK_BLOGS[3], role: "owner" }}>
    <div
      className={clsx(css["grid"], css["grid-container"], css["no-sidenav"])}
    >
      <BlogNavbar />
      <LeftSidebar />
      <main data-root={"true"}>{children}</main>
      <RightSidebar />
      <SplashScreen />
    </div>
  </BlogContext.Provider>
);

export default BlogLayout;
