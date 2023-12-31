import React from "react";

import { PolymorphicProps } from "~/types/index";

export type InputSize = "lg" | "md" | "sm";
export type InputColor = "inverted" | "ruby";

export interface InputProps
  extends Omit<React.ComponentPropsWithRef<"input">, "size"> {
  /**
   * Automatically resize the component to `lg` when the viewport width is
   * smaller than or equal to tablet
   * @default false
   */
  auto_size?: boolean;
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
  end_decorator?: React.ReactNode;
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
  slot_props?: {
    container?: PolymorphicProps<"div">;
    decorator?: React.ComponentPropsWithoutRef<"span">;
    end_decorator?: React.ComponentPropsWithRef<"span">;
    spinner_container?: React.ComponentPropsWithoutRef<"span">;
    spinner_decrement_button?: React.ComponentPropsWithoutRef<"button">;
    spinner_increment_button?: React.ComponentPropsWithoutRef<"button">;
    spinner_separator?: React.ComponentPropsWithoutRef<"span">;
  };
}
