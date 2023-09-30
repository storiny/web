import React from "react";

import { PopoverProps } from "~/components/popover";

import { ColorPickerProps as ColorPickerCoreProps } from "./core/components/color-picker";

export interface ColorPickerProps extends ColorPickerCoreProps {
  /**
   * Trigger child
   */
  children?: React.ReactNode;
  /**
   * Props passed to the Popover component
   */
  popover_props?: Partial<PopoverProps>;
}
