import { Switch } from "radix-ui";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type SwitchColor = "inverted" | "ruby";
export type SwitchSize = "md" | "sm";

type SwitchPrimitive = Switch.SwitchProps & PolymorphicProps<"button">;

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
  slot_props?: {
    bar_indicator?: React.ComponentPropsWithoutRef<"svg">;
    ring_indicator?: React.ComponentPropsWithoutRef<"svg">;
    thumb?: Switch.SwitchThumbProps;
  };
}
