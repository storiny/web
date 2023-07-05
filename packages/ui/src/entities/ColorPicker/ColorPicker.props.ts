import React from "react";

import { ColorPickerProps as ColorPickerCoreProps } from "./core/components/ColorPicker";

export interface ColorPickerProps extends ColorPickerCoreProps {
  /**
   * Trigger child
   */
  children?: React.ReactNode;
}
