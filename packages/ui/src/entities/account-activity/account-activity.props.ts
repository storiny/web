import { AccountActivity } from "@storiny/types";
import React from "react";

export interface AccountActivityProps
  extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The account activity object
   */
  account_activity: AccountActivity;
  /**
   * If `true`, does not render the vertical connecting pipe
   * @default false
   */
  hide_pipe?: boolean;
}
