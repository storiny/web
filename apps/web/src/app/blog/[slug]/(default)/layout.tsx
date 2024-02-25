import React from "react";

import BlogContent from "../content";

const DefaultBlogLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <React.Fragment>
    <BlogContent />
    {children}
  </React.Fragment>
);

export default DefaultBlogLayout;
