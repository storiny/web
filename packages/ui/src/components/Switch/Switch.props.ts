import {
  SwitchProps as SwitchPrimitiveProps,
  SwitchThumbProps
} from "@radix-ui/react-switch";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type SwitchColor = "inverted" | "ruby";
export type SwitchSize = "md" | "sm";

type SwitchPrimitive = SwitchPrimitiveProps & PolymorphicProps<"button">;

export interface SwitchProps extends SwitchPrimitive {
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: SwitchColor;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: SwitchSize;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    barIndicator?: React.ComponentPropsWithoutRef<"svg">;
    ringIndicator?: React.ComponentPropsWithoutRef<"svg">;
    thumb?: SwitchThumbProps;
  };
}
