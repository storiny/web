import { Reply } from "@storiny/types";
import React from "react";

export interface ReplyProps extends React.ComponentPropsWithoutRef<"article"> {
  /**
   * Enables SSR.
   */
  enableSsr?: boolean;
  /**
   * If `true`, renders with static properties
   */
  isStatic?: boolean;
  /**
   * Whether the reply is nested under a comment.
   */
  nested?: boolean;
  /**
   * The reply object.
   */
  reply: Reply;
  /**
   * Whether the reply is rendered inside a virtualized list.
   */
  virtual?: boolean;
}
