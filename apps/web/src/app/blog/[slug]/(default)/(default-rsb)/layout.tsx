import React from "react";

import BlogRightSidebar from "~/layout/blog-right-sidebar";

import BlogContent from "../../content";

const BlogDefaultRightSidebarLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <React.Fragment>
    <main data-root={"true"}>
      <BlogContent />
      {children}
    </main>
    <BlogRightSidebar />
  </React.Fragment>
);

export default BlogDefaultRightSidebarLayout;
