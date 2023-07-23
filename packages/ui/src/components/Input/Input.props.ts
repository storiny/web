import React from "react";

import { PolymorphicProps } from "~/types/index";

export type InputSize = "lg" | "md" | "sm";
export type InputColor = "inverted" | "ruby";

export interface InputProps
  extends Omit<React.ComponentPropsWithRef<"input">, "size"> {
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: InputColor;
  /**
   * The element placed before the children.
   */
  decorator?: React.ReactNode;
  /**
   * The element placed after the children. Accepts IconButton and Select.
   */
  endDecorator?: React.ReactNode;
  /**
   * If `true`, renders with a monospaced font
   * @default false
   */
  monospaced?: boolean;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: InputSize;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    container?: PolymorphicProps<"div">;
    decorator?: React.ComponentPropsWithoutRef<"span">;
    endDecorator?: React.ComponentPropsWithRef<"span">;
    spinnerContainer?: React.ComponentPropsWithoutRef<"span">;
    spinnerDecrementButton?: React.ComponentPropsWithoutRef<"button">;
    spinnerIncrementButton?: React.ComponentPropsWithoutRef<"button">;
    spinnerSeparator?: React.ComponentPropsWithoutRef<"span">;
  };
}
