import React from "react";

import { PopoverProps } from "~/components/Popover";

import { ColorPickerProps as ColorPickerCoreProps } from "./core/components/ColorPicker";

export interface ColorPickerProps extends ColorPickerCoreProps {
  /**
   * Trigger child
   */
  children?: React.ReactNode;
  /**
   * Props passed to the Popover component
   */
  popoverProps?: Partial<PopoverProps>;
}
