import { Dialog } from "radix-ui";
import React from "react";

export interface ModalHeaderProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The element placed before the children.
   */
  decorator?: React.ReactNode;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
    title?: Dialog.DialogTitleProps;
  };
}
