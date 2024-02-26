import React from "react";

import BlogLeftSidebar from "~/layout/blog-left-sidebar";
import BlogNavbar from "~/layout/blog-navbar";
import SplashScreen from "~/layout/splash-screen";
 
const DefaultBlogLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <React.Fragment>
    <BlogNavbar />
    <BlogLeftSidebar />
    {children}
    <SplashScreen />
  </React.Fragment>
);

export default DefaultBlogLayout;
