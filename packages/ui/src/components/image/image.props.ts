import { AvatarFallbackProps, AvatarImageProps } from "@radix-ui/react-avatar";
import { AssetRating, ImageSize } from "@storiny/shared";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export interface ImageProps extends PolymorphicProps<"div"> {
  /**
   * The alt text for the image.
   */
  alt: React.ComponentPropsWithoutRef<"img">["alt"];
  /**
   * The height of the component in pixels.
   */
  height?: number;
  /**
   * The dominant hex color code of the image element with the `#` prefix, shown when the image is being loaded.
   */
  hex?: string | null;
  /**
   * The CDN key of the image. This will override the `src` prop.
   */
  img_key?: string | null;
  /**
   * Ref passed to the native image element
   */
  img_ref?: React.RefObject<HTMLImageElement>;
  /**
   * The image rating, used to render an overlay warning
   */
  rating?: AssetRating;
  /**
   * The size of the component for generating the CDN URL.
   */
  size?: ImageSize;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    fallback?: AvatarFallbackProps;
    image?: AvatarImageProps;
    overlay?: React.ComponentPropsWithoutRef<"div">;
  };
  /**
   * The source of the image.
   */
  src?: React.ComponentPropsWithoutRef<"img">["src"];
  /**
   * The width of the component in pixels.
   */
  width?: number;
}
