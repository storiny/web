import { LinkProps } from "next/link";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type TypographyColor = "muted" | "minor" | "major" | "legible";

export type TypographyScale =
  | "display1"
  | "display2"
  | "xl2"
  | "xl"
  | "lg"
  | "md"
  | "sm"
  | "xs"
  | "body3"
  | "body2"
  | "body1";

export type TypographyLevel =
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
  | "inline-code"
  | "mention"
  | "tag"
  | "quote";

export type TypographyElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "time"
  | "div"
  | "code";

// Not polymorphic
export type TypographyProps = Omit<
  PolymorphicProps<TypographyElement>,
  "color"
> & {
  /**
   * The color of the component.
   * @default 'major'
   */
  color?: TypographyColor;
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
   * The level of the component.
   * @default 'body1'
   */
  level?: TypographyLevel;
  /**
   * The scale of the component. Overrides the font size and line height coming
   * from the `level` prop.
   */
  scale?: TypographyScale;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    ellipsis_cell?: React.ComponentPropsWithoutRef<"span">;
    link?: Partial<LinkProps> & React.ComponentPropsWithoutRef<"a">;
  };
};
