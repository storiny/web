import { User } from "@storiny/types";
import React from "react";

export interface UserProps extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The type of action to render
   * @default 'default'
   */
  action_type?: "default" | "block" | "mute";
  /**
   * A custom action item for the action menu.
   */
  custom_action?: (user: User) => React.ReactNode;
  /**
   * If `true`, skips rendering the action button.
   */
  hide_action?: boolean;
  /**
   * The user object.
   */
  user: User;
  /**
   * Whether the user is rendered inside a virtualized list.
   */
  virtual?: boolean;
}
