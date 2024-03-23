import { Blog } from "@storiny/types";
import React from "react";

export interface BlogProps extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The blog object.
   */
  blog: Blog;
  /**
   * Whether the blog is rendered inside a virtualized list.
   */
  virtual?: boolean;
}
