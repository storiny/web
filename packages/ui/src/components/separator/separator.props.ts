import { DropdownMenu } from "radix-ui";

import { PolymorphicProps } from "~/types/index";

type SeparatorPrimitive = DropdownMenu.DropdownMenuSeparatorProps &
  PolymorphicProps<"div">;

export interface SeparatorProps extends SeparatorPrimitive {
  /**
   * If `true`, adds margin to left and right instead of top and bottom
   */
  invert_margin?: boolean;
}
