import { DialogTitleProps } from "@radix-ui/react-dialog";
import React from "react";

export interface ModalHeaderProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The element placed before the children.
   */
  decorator?: React.ReactNode;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
    title?: DialogTitleProps;
  };
}
