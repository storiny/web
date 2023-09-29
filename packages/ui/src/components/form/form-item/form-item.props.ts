import React from "react";

export interface FormItemProps extends React.ComponentPropsWithRef<"fieldset"> {
  /**
   * The required flag
   * @default false
   */
  required?: boolean;
}
