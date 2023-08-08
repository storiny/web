import React from "react";

import { IconButtonProps } from "~/components/IconButton";

export interface PageTitleProps
  extends React.ComponentPropsWithoutRef<"header"> {
  /**
   * The props passed to the individual entity components
   */
  componentProps?: {
    backButton?: IconButtonProps;
  };
  /**
   * If `true`, renders a dashboard page title
   */
  dashboard?: boolean;
  /**
   * If `true`, hides the back button
   */
  hideBackButton?: boolean;
}
