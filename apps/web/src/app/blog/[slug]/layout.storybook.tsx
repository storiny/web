import { Blog } from "@storiny/types";
import { MOCK_BLOGS } from "@storiny/ui/src/mocks";
import React from "react";

import BlogContext from "~/common/context/blog";

const StorybookBlogLayout = ({
  children,
  role = null,
  blog
}: {
  blog?: Partial<Blog>;
  children: React.ReactNode;
  role?: "owner" | "editor" | "writer" | null;
}): React.ReactElement => (
  <BlogContext.Provider
    value={{
      ...MOCK_BLOGS[0],
      ...blog,
      role
    }}
  >
    {children}
  </BlogContext.Provider>
);

export default StorybookBlogLayout;
