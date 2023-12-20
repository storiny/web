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
  ((name.match(/(\b\S)?/g) || []).join("").match(/(^\S|\S$)?/g) || []).join("");

const AVATAR_IMAGE_SIZE_MAP: Record<AvatarSize, ImageSize> = {
  xl2: ImageSize.W_128,
  xl: ImageSize.W_64,
  lg: ImageSize.W_64,
  md: ImageSize.W_32,
  sm: ImageSize.W_24,
  xs: ImageSize.W_24
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
  const [status, set_status] = React.useState<ImageLoadingStatus>("loading");
  let final_src = src;

  if (avatar_id) {
    final_src = get_cdn_url(avatar_id, AVATAR_IMAGE_SIZE_MAP[size]);
  }

  return (
    <Root
      {...rest}
      asChild
      className={clsx(
        styles.avatar,
        size && common_styles[size],
        !borderless && styles.border,
        status === "loaded" && styles.loaded,
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
            onLoadingStatusChange={set_status}
            src={final_src}
          />
        )}
        {children || status === "error" ? (
          <Fallback
            delayMs={children ? 0 : 500}
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
