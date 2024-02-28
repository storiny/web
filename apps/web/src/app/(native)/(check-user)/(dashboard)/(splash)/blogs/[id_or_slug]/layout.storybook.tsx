import { Blog } from "@storiny/types";
import { MOCK_BLOGS } from "@storiny/ui/src/mocks";
import React from "react";

import BlogContext from "~/common/context/blog";

import DashboardFooter from "../../common/footer";
import BlogDefaultDashboardLeftSidebar from "./left-sidebar";

const StorybookBlogDashboardLayout = ({
  role = "editor",
  blog,
  children
}: {
  blog?: Partial<Blog>;
  children: React.ReactNode;
  role?: "owner" | "editor";
}): React.ReactElement => (
  <BlogContext.Provider
    value={{
      ...MOCK_BLOGS[0],
      ...blog,
      role
    }}
  >
    <BlogDefaultDashboardLeftSidebar />
    {children}
    <DashboardFooter />
  </BlogContext.Provider>
);

export default StorybookBlogDashboardLayout;
