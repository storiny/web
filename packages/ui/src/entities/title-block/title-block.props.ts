import React from "react";

import { TypographyProps } from "src/components/typography";

export interface TitleBlockProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  /**
   * The props passed to the individual entity components
   */
  component_props?: {
    content?: TypographyProps;
    title?: TypographyProps;
  };
  /**
   * Title for the block
   */
  title: React.ReactNode;
}
