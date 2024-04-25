import React from "react";

import { PolymorphicProps } from "~/types/index";

export interface BadgeArrayProps extends PolymorphicProps<"span"> {
  /**
   * The public flags of the user.
   */
  flags: number;
  /**
   * The membership status for the user.
   * @default false
   */
  is_plus_member?: boolean;
  /**
   * The size of the badges (in px).
   * @default 16
   */
  size?: number;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    badge: React.ComponentPropsWithoutRef<"svg">;
  };
}
