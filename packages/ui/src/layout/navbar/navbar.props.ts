import React from "react";

export type NavbarVariant = "default" | "minimal";

export interface NavbarProps extends React.ComponentPropsWithoutRef<"header"> {
  /**
   * The dashboard boolean flag, indicating whether the navbar is used for dashboard pages.
   * @default false
   */
  is_dashboard?: boolean;
  /**
   * The entity variant.
   * @default 'default'
   */
  variant?: NavbarVariant;
}
