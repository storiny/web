import {
  AvatarFallbackProps,
  AvatarImageProps,
  AvatarProps as AvatarPrimitiveProps
} from "@radix-ui/react-avatar";

import { PolymorphicProps } from "~/types/index";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "xl2";

type AvatarPrimitive = Omit<
  AvatarPrimitiveProps & PolymorphicProps<"span">,
  "color"
>;

export interface AvatarProps extends AvatarPrimitive {
  /**
   * The alt text for the image.
   */
  alt?: string;
  /**
   * The CDN id of the avatar image. This will override the src prop.
   */
  avatarId?: string | null;
  /**
   * Whether to apply border around the image.
   * @default false
   */
  borderless?: boolean;
  /**
   * The dominant hex color code of the image element with the `#` prefix, shown when the image is being loaded.
   */
  hex?: string | null;
  /**
   * The label for computing fallback color and initials. Usually the name property of the user.
   */
  label?: string;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: AvatarSize;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    fallback?: AvatarFallbackProps;
    image?: AvatarImageProps;
  };
  /**
   * The source of the image element.
   */
  src?: string;
}
