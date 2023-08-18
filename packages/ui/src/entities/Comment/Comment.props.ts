import { Comment } from "@storiny/types";
import React from "react";

export interface CommentProps
  extends React.ComponentPropsWithoutRef<"article"> {
  /**
   * The comment object.
   */
  comment: Comment;
  /**
   * Enables SSR.
   */
  enableSsr?: boolean;
  /**
   * If `true`, renders with extended properties
   */
  isExtended?: boolean;
  /**
   * If `true`, renders with static properties
   */
  isStatic?: boolean;
}
