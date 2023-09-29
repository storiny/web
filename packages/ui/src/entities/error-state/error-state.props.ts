import React from "react";

import { ButtonProps } from "~/components/button";

export type ErrorStateSize = "md" | "sm";
export type ErrorStateType = "server" | "network";

export interface ErrorStateProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Automatically resize the entity based on viewport width.
   * @default false
   */
  auto_size?: boolean;
  /**
   * The props passed to the individual entity components.
   */
  component_props?: { button?: ButtonProps };
  /**
   * The retry callback.
   */
  retry?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * The size of the entity.
   * @default 'md'
   */
  size?: ErrorStateSize;
  /**
   * The type of the error.
   * @default 'network'
   */
  type?: ErrorStateType;
}
