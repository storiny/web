import { MOCK_BLOGS } from "@storiny/ui/src/mocks";
import { clsx } from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

import BlogContext from "./context";

const StorybookBlogLayout = ({
  children,
  role = null
}: {
  children: React.ReactNode;
  role?: "owner" | "editor" | "writer" | null;
}): React.ReactElement => (
  <BlogContext.Provider
    value={{
      ...MOCK_BLOGS[0],
      role
    }}
  >
    <div
      className={clsx(css["grid"], css["grid-container"], css["no-sidenav"])}
    >
      {children}
    </div>
  </BlogContext.Provider>
);

export default StorybookBlogLayout;
