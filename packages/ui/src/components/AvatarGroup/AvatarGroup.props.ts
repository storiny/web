import { PolymorphicProps } from "~/types/index";

import { AvatarProps } from "../Avatar";

export type AvatarGroupSize = "xs" | "sm" | "md" | "lg" | "xl" | "xl2";

export interface AvatarGroupProps extends PolymorphicProps<"div"> {
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: AvatarGroupSize;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    overflow?: Omit<AvatarProps, "alt">;
  };
}
