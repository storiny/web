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
   * The reply object.
   */
  reply: Reply;
}
