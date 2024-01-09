import React from "react";

import { TypographyProps } from "~/components/typography";

export interface AreaChartProps extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * Optional caption for the block
   */
  caption?: React.ReactNode;
  /**
   * Icon for the caption. Pass `increment` or `decrement` to render preset
   * icons, or pass a custom icon.
   */
  caption_icon?: "increment" | "decrement" | React.ReactNode;
  /**
   * The props passed to the individual entity components
   */
  component_props?: {
    caption?: TypographyProps;
    label?: TypographyProps;
    value?: TypographyProps;
  };
  /**
   * Label for the block
   */
  label: React.ReactNode;
  /**
   * Value for the block
   */
  value: React.ReactNode;
}
