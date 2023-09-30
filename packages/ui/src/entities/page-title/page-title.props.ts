import React from "react";

import { IconButtonProps } from "~/components/icon-button";

export interface PageTitleProps
  extends React.ComponentPropsWithoutRef<"header"> {
  /**
   * Custom location for the back button
   */
  back_button_href?: string;
  /**
   * The props passed to the individual entity components
   */
  component_props?: {
    back_button?: IconButtonProps;
  };
  /**
   * If `true`, renders a dashboard page title
   */
  dashboard?: boolean;
  /**
   * If `true`, hides the back button
   */
  hide_back_button?: boolean;
}
