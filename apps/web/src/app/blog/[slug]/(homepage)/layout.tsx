import React from "react";

import BlogLeftSidebar from "~/layout/blog-left-sidebar";
import BlogNavbar from "~/layout/blog-navbar";
import BlogRightSidebar from "~/layout/blog-right-sidebar";
import SplashScreen from "~/layout/splash-screen";
 
const BlogHomepageLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <React.Fragment>
    <BlogNavbar />
    <BlogLeftSidebar is_homepage />
    <main data-root={"true"}>{children}</main>
    <BlogRightSidebar is_homepage />
    <SplashScreen />
  </React.Fragment>
);

export default BlogHomepageLayout;
