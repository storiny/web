import { User } from "@storiny/types";
import React from "react";

export interface UserProps extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The type of action to render
   * @default 'default'
   */
  action_type?: "default" | "block" | "mute";
  /**
   * The user object.
   */
  user: User;
  /**
   * Whether the user is rendered inside a virtualized list.
   */
  virtual?: boolean;
}
