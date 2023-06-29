import React from "react";

export type NavbarVariant = "default" | "minimal";

export interface NavbarProps extends React.ComponentPropsWithoutRef<"header"> {
  /**
   * The entity variant.
   * @default 'default'
   */
  variant?: NavbarVariant;
}
