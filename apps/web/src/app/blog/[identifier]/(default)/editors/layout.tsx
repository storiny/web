import React from "react";

import Main from "~/components/main";
import BlogRightSidebar from "~/layout/blog-right-sidebar";

import BlogContent from "../../content";

const BlogEditorsLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <React.Fragment>
    <Main>
      <BlogContent />
      {children}
    </Main>
    <BlogRightSidebar hide_editors />
  </React.Fragment>
);

export { metadata } from "./metadata";
export default BlogEditorsLayout;
