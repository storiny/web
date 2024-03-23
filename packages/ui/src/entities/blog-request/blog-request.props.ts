import { BlogRequest } from "@storiny/types";
import React from "react";

export interface BlogRequestProps
  extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The blog request object
   */
  blog_request: BlogRequest;
}
