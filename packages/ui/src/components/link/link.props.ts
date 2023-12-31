import { LinkProps as NextLinkProps } from "next/link";
import React from "react";

import { TypographyScale } from "../typography";

export type LinkColor = "body" | "beryl";
export type LinkUnderline = "always" | "hover" | "never";
export type LinkScale = TypographyScale;
export type LinkLevel =
  | "display1"
  | "display2"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "legible"
  | "body1"
  | "body2"
  | "body3"
  | "inherit";

// Cannot be a polymorphic component
type LinkPrimitive = NextLinkProps & React.ComponentPropsWithRef<"a">;

export interface LinkProps extends LinkPrimitive {
  /**
   * The color of the component.
   * @default 'body'
   */
  color?: LinkColor;
  /**
   * The disabled state.
   * @default false
   */
  disabled?: boolean;
  /**
   * If `true`, the text will not wrap, but instead will truncate with a text
   * overflow ellipsis.
   *
   * Note that text overflow can only happen with block or inline-block level
   * elements (the element needs to have a width in order to overflow).
   * @default false
   */
  ellipsis?: boolean;
  /**
   * If `true`, the link will only have `major` color, and will not change colors on hovering.
   * @default false
   */
  fixed_color?: boolean;
  /**
   * The level of the component. Inherits from Typography component if present as a parent.
   * @default 'inherit'
   */
  level?: LinkLevel;
  /**
   * The scale of the component. Overrides the font size and line height coming
   * from the `level` prop.
   */
  scale?: LinkScale;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    ellipsis_cell?: React.ComponentPropsWithoutRef<"span">;
  };
  /**
   * Controls when the link should have an underline.
   * @default 'hover'
   */
  underline?: LinkUnderline;
}
