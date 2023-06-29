import React from "react";

export type CustomStateSize = "md" | "sm";

export interface CustomStateProps
  extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  /**
   * Automatically resize the entity based on viewport width.
   * @default false
   */
  autoSize?: boolean;
  /**
   * The description of the state.
   */
  description?: React.ReactNode;
  /**
   * The element placed above the children.
   */
  icon?: React.ReactNode;
  /**
   * The size of the entity.
   * @default 'md'
   */
  size?: CustomStateSize;
  /**
   * The title of the state.
   */
  title: React.ReactNode;
}
