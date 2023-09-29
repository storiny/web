import React from "react";

// Not polymorphic
export interface SvgIconProps extends React.ComponentPropsWithRef<"svg"> {
  /**
   * The color of the component.
   * @default 'inherit'
   */
  color?: React.CSSProperties["color"];
  /**
   * Tf `true`, fills the component instead of stroking the shape.
   * @default false
   */
  no_stroke?: boolean;
  /**
   * The rotation of the component in degrees.
   * @default 0
   */
  rotation?: number;
  /**
   * The size of the component in pixels.
   * @default '1em' (through css)
   */
  size?: number;
}
