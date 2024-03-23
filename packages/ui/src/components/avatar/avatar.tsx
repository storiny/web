"use client";

import {
  Fallback,
  Image,
  ImageLoadingStatus,
  Root
} from "@radix-ui/react-avatar";
import { ImageSize } from "@storiny/shared";
import clsx from "clsx";
import React from "react";

import { AvatarGroupContext } from "~/components/avatar-group/avatar-group-context";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";
import { get_cdn_url } from "~/utils/get-cdn-url";

import common_styles from "../common/avatar-size.module.scss";
import styles from "./avatar.module.scss";
import { AvatarProps, AvatarSize } from "./avatar.props";

const AVATAR_CACHE = new Set<string>([]);

/**
 * Computes a unique hue value based on the given string
 * @param str String
 */
const str_to_hue = (str = ""): string =>
  ([...str].reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0) %
    360) +
  "deg";

/**
 * Returns the initials for the provided name
 * @param name Name
 */
const get_name_initials = (name: string): string =>
  (
    (name.match(/(^\S\S?|\s\S)?/g) || [])
      .map((part) => part.trim())
      .join("")
      .match(/(^\S|\S$)?/g) || []
  )
    .join("")
    .toLocaleUpperCase();

const AVATAR_IMAGE_SIZE_MAP: Record<AvatarSize, ImageSize> = {
  xl2: ImageSize.W_128,
  xl: ImageSize.W_128,
  lg: ImageSize.W_128,
  md: ImageSize.W_64,
  sm: ImageSize.W_64,
  xs: ImageSize.W_64
};

const Avatar = forward_ref<AvatarProps, "span">((props, ref) => {
  const {
    as: Component = "span",
    avatar_id,
    hex,
    size: size_prop,
    src,
    label,
    alt,
    borderless,
    className,
    slot_props,
    style,
    children,
    ...rest
  } = props;
  const { size: avatar_group_size } =
    React.useContext(AvatarGroupContext) || {};
  const size = avatar_group_size || size_prop || "md";
  const final_src = avatar_id
    ? get_cdn_url(avatar_id, AVATAR_IMAGE_SIZE_MAP[size])
    : src;
  const is_image_cached = AVATAR_CACHE.has(final_src || "");
  const [status, set_status] = React.useState<ImageLoadingStatus>(
    is_image_cached ? "loaded" : "loading"
  );

  React.useEffect(() => {
    if (final_src && status === "loaded") {
      AVATAR_CACHE.add(final_src);
    }
  }, [status, final_src]);

  return (
    <Root
      {...rest}
      asChild
      className={clsx(
        styles.avatar,
        size && common_styles[size],
        !borderless && styles.border,
        status === "loaded" && styles.loaded,
        is_image_cached && styles["no-animation"],
        className
      )}
      ref={ref}
      style={
        {
          ...(hex && { "--hex": `#${hex}` }),
          ...style
        } as React.CSSProperties
      }
    >
      <Component>
        {!children && (
          <Image
            {...slot_props?.image}
            alt={alt}
            className={clsx(styles.image, slot_props?.image?.className)}
            onLoadingStatusChange={(next_status): void =>
              status === "loaded" ? undefined : set_status(next_status)
            }
            src={final_src}
          />
        )}
        {children || status === "error" ? (
          <Fallback
            {...slot_props?.fallback}
            className={clsx(
              css["flex-center"],
              styles.fallback,
              slot_props?.fallback?.className
            )}
            style={
              {
                "--bg": children
                  ? "var(--bg-elevation-lg)"
                  : `hsl(${str_to_hue(label || alt)} 35% 50%)`,
                "--fg": children ? "var(--fg-major)" : "var(--snow)",
                ...slot_props?.fallback?.style
              } as React.CSSProperties
            }
          >
            {children || get_name_initials(label || alt || "")}
          </Fallback>
        ) : null}
      </Component>
    </Root>
  );
});

Avatar.displayName = "Avatar";

export default Avatar;
