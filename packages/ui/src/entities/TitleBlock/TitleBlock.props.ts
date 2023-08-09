import React from "react";

import { TypographyProps } from "~/components/Typography";

export interface TitleBlockProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  /**
   * The props passed to the individual entity components
   */
  componentProps?: {
    content?: TypographyProps;
    title?: TypographyProps;
  };
  /**
   * Title for the block
   */
  title: React.ReactNode;
}
