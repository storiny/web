import { User } from "@storiny/types";
import React from "react";

export interface UserProps extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The user object.
   */
  user: User;
}
