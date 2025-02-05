import { ScrollArea } from "radix-ui";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type ScrollAreaSize = "lg" | "md";

type ScrollAreaPrimitive = ScrollArea.ScrollAreaProps & PolymorphicProps<"div">;

export interface ScrollAreaProps extends ScrollAreaPrimitive {
  /**
   * Whether to enable horizontal scrolling.
   * @default false
   */
  enable_horizontal?: boolean;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: ScrollAreaSize;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    corner?: ScrollArea.ScrollAreaCornerProps;
    scrollbar?: ScrollArea.ScrollAreaScrollbarProps;
    thumb?: ScrollArea.ScrollAreaThumbProps;
    viewport?: ScrollArea.ScrollAreaViewportProps &
      React.ComponentPropsWithRef<"div">;
  };
}
