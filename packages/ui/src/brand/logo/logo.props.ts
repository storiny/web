import React from "react";

export interface LogoProps extends React.ComponentPropsWithRef<"svg"> {
  /**
   * The height and width of the component in pixels.
   * @default 64
   */
  size?: number;
}
