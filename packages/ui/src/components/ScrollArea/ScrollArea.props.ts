import {
  ScrollAreaCornerProps,
  ScrollAreaProps as ScrollAreaPrimitiveProps,
  ScrollAreaScrollbarProps,
  ScrollAreaThumbProps,
  ScrollAreaViewportProps
} from "@radix-ui/react-scroll-area";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type ScrollAreaSize = "lg" | "md";

type ScrollAreaPrimitive = ScrollAreaPrimitiveProps & PolymorphicProps<"div">;

export interface ScrollAreaProps extends ScrollAreaPrimitive {
  /**
   * Whether to enable horizontal scrolling.
   * @default false
   */
  enableHorizontal?: boolean;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: ScrollAreaSize;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    corner?: ScrollAreaCornerProps;
    scrollbar?: ScrollAreaScrollbarProps;
    thumb?: ScrollAreaThumbProps;
    viewport?: ScrollAreaViewportProps & React.ComponentPropsWithRef<"div">;
  };
}
