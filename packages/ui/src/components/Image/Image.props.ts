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
   * The CDN id of the image. This will override the src prop.
   */
  imgId?: string | null;
  /**
   * Ref passed to the native image element
   */
  imgRef?: React.RefObject<HTMLImageElement>;
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
  slotProps?: {
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
