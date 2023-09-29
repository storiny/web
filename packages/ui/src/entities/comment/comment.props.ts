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
  enable_ssr?: boolean;
  /**
   * If `true`, does not render an overlay for hidden comments
   */
  hide_hidden_overlay?: boolean;
  /**
   * If `true`, renders with extended properties
   */
  is_extended?: boolean;
  /**
   * If `true`, renders with static properties
   */
  is_static?: boolean;
  /**
   * Whether the comment is rendered inside a virtualized list.
   */
  virtual?: boolean;
}
