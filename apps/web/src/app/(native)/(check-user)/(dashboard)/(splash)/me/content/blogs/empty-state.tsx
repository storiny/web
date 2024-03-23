import React from "react";

import CustomState from "~/entities/custom-state";
import BlogIcon from "~/icons/blog";

const BlogsEmptyState = (): React.ReactElement => (
  <CustomState
    auto_size
    description={"When you create or join blogs, they will show up here."}
    icon={<BlogIcon />}
    title={"No blogs"}
  />
);

export default BlogsEmptyState;
