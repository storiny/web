"use client";

import { Fallback, Image, Root } from "@radix-ui/react-avatar";
import { ImageSize } from "@storiny/shared";
import clsx from "clsx";
import React from "react";

import { AvatarGroupContext } from "~/components/AvatarGroup/AvatarGroupContext";
import { forwardRef } from "~/utils/forwardRef";
import { getCdnUrl } from "~/utils/getCdnUrl";

import commonStyles from "../common/AvatarSize.module.scss";
import styles from "./Avatar.module.scss";
import { AvatarProps, AvatarSize } from "./Avatar.props";

const strToHue = (str: string = ""): string =>
  ([...str].reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0) %
    360) +
  "deg";

const getInitials = (name: string): string =>
  ((name.match(/(\b\S)?/g) || []).join("").match(/(^\S|\S$)?/g) || []).join("");

const avatarSizeToImgSizeMap: Record<AvatarSize, ImageSize> = {
  xl2: ImageSize.W_128,
  xl: ImageSize.W_64,
  lg: ImageSize.W_64,
  md: ImageSize.W_32,
  sm: ImageSize.W_24,
  xs: ImageSize.W_24,
};

const Avatar = forwardRef<AvatarProps, "span">((props, ref) => {
  const {
    as: Component = "span",
    avatarId,
    hex,
    size: sizeProp,
    src,
    label,
    alt,
    borderless,
    className,
    slotProps,
    style,
    children,
    ...rest
  } = props;
  const { size: avatarGroupSize } = React.useContext(AvatarGroupContext) || {};
  const size = avatarGroupSize || sizeProp || "md";
  const [loaded, setLoaded] = React.useState<boolean>(false);
  let finalSrc = src;

  if (avatarId) {
    finalSrc = getCdnUrl(avatarId, avatarSizeToImgSizeMap[size]);
  }

  return (
    <Root
      {...rest}
      asChild
      className={clsx(
        styles.avatar,
        size && commonStyles[size],
        !borderless && styles.border,
        loaded && styles.loaded,
        className
      )}
      ref={ref}
      style={
        {
          ...(hex && { "--hex": `#${hex}` }),
          ...style,
        } as React.CSSProperties
      }
    >
      <Component>
        {!children && (
          <Image
            {...slotProps?.image}
            alt={alt}
            className={clsx(styles.image, slotProps?.image?.className)}
            onLoadingStatusChange={(status) => setLoaded(status === "loaded")}
            src={finalSrc}
          />
        )}
        <Fallback
          delayMs={children ? 0 : 500}
          {...slotProps?.fallback}
          className={clsx(
            "flex-center",
            styles.fallback,
            slotProps?.fallback?.className
          )}
          style={
            {
              "--bg": children
                ? "var(--bg-elevation-lg)"
                : `hsl(${strToHue(label || alt)} 35% 50%)`,
              "--fg": children ? "var(--fg-major)" : "var(--snow)",
              ...slotProps?.fallback?.style,
            } as React.CSSProperties
          }
        >
          {children || getInitials(label || alt || "")}
        </Fallback>
      </Component>
    </Root>
  );
});

Avatar.displayName = "Avatar";

export default Avatar;
