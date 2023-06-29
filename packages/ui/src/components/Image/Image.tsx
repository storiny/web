"use client";

import {
  Fallback,
  Image as ImagePrimitive,
  Root,
} from "@radix-ui/react-avatar";
import clsx from "clsx";
import React from "react";

import Typography from "~/components/Typography";
import { forwardRef } from "~/utils/forwardRef";
import { getCdnUrl } from "~/utils/getCdnUrl";

import styles from "./Image.module.scss";
import { ImageProps } from "./Image.props";

const Image = forwardRef<ImageProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    size,
    imgId,
    hex,
    src,
    alt,
    width,
    height,
    className,
    slotProps,
    style,
    children,
    ...rest
  } = props;
  const [loaded, setLoaded] = React.useState<boolean>(false);
  let finalSrc = src;

  if (imgId) {
    finalSrc = getCdnUrl(imgId, size);
  }

  return (
    <Root
      {...rest}
      asChild
      className={clsx(styles.image, loaded && styles.loaded, className)}
      ref={ref}
      style={
        {
          ...(hex && { "--hex": `#${hex}` }),
          ...(typeof width !== "undefined" && { "--width": `${width}px` }),
          ...(typeof height !== "undefined" && { "--height": `${height}px` }),
          ...style,
        } as React.CSSProperties
      }
    >
      <Component>
        {!children && (
          <ImagePrimitive
            {...slotProps?.image}
            alt={alt}
            className={clsx(
              styles["native-image"],
              slotProps?.image?.className
            )}
            onLoadingStatusChange={(status) => setLoaded(status === "loaded")}
            src={finalSrc}
          />
        )}
        <Fallback
          delayMs={500}
          {...slotProps?.fallback}
          className={clsx(
            "flex-center",
            styles.fallback,
            slotProps?.fallback?.className
          )}
        >
          <Typography className={"t-minor"} level={"body2"}>
            Image not available
          </Typography>
        </Fallback>
      </Component>
    </Root>
  );
});

Image.displayName = "Image";

export default Image;
