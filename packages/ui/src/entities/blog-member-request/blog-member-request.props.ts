import { BlogMemberRequest } from "@storiny/types";
import React from "react";

export interface BlogMemberRequestProps
  extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The blog member request object
   */
  blog_member_request: BlogMemberRequest;
  /**
   * The role of the blog member
   */
  role: "editor" | "writer";
}
