import React from "react";

import { PolymorphicProps } from "~/types/index";

export type TextareaSize = "md" | "sm";
export type TextareaColor = "inverted" | "ruby";

export interface TextareaProps extends React.ComponentPropsWithRef<"textarea"> {
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: TextareaColor;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: TextareaSize;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    container?: PolymorphicProps<"div">;
  };
}
