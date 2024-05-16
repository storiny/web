import { Blog } from "@storiny/types";
import { MOCK_BLOGS } from "@storiny/ui/src/mocks";
import React from "react";

import BlogContextProvider from "~/common/context/blog";

const StorybookBlogLayout = ({
  children,
  role = null,
  blog
}: {
  blog?: Partial<Blog>;
  children: React.ReactNode;
  role?: "owner" | "editor" | "writer" | null;
}): React.ReactElement => (
  <BlogContextProvider
    value={{
      ...MOCK_BLOGS[0],
      ...blog,
      role
    }}
  >
    {children}
  </BlogContextProvider>
);

export default StorybookBlogLayout;
