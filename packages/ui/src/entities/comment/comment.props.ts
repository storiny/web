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
   * If `true`, does not render an overlay for hidden comments
   */
  hideHiddenOverlay?: boolean;
  /**
   * If `true`, renders with extended properties
   */
  isExtended?: boolean;
  /**
   * If `true`, renders with static properties
   */
  isStatic?: boolean;
  /**
   * Whether the comment is rendered inside a virtualized list.
   */
  virtual?: boolean;
}
