import React from "react";

import { PolymorphicProps } from "~/types/index";

export interface AspectRatioProps extends PolymorphicProps<"div"> {
  /**
   * The CSS `object-fit` value of the first child.
   * @default 'cover'
   */
  objectFit?: React.CSSProperties["objectFit"];
  /**
   * The desired ratio.
   * @default 1
   */
  ratio?: number;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    wrapper?: React.ComponentPropsWithoutRef<"div">;
  };
}
