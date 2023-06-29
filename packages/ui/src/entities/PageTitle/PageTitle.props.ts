import React from "react";

import { IconButtonProps } from "~/components/IconButton";

export interface PageTitleProps
  extends React.ComponentPropsWithoutRef<"header"> {
  /**
   * The props passed to the individual entity components.
   */
  componentProps?: {
    backButton?: IconButtonProps;
  };
}
