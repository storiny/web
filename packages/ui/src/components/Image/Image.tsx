"use client";

import {
  Fallback,
  Image as ImagePrimitive,
  Root
} from "@radix-ui/react-avatar";
import { AssetRating } from "@storiny/shared";
import clsx from "clsx";
import React from "react";

import Button from "~/components/Button";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import WarningIcon from "~/icons/Warning";
import { forwardRef } from "~/utils/forwardRef";
import { getCdnUrl } from "~/utils/getCdnUrl";

import styles from "./Image.module.scss";
import { ImageProps } from "./Image.props";

const assetRatingDescriptionMap: Record<AssetRating, string> = {
  [AssetRating.VIOLENCE /*         */]:
    "This image may contain violent content.",
  [AssetRating.SENSITIVE /*        */]:
    "This image may contain sensitive content.",
  [AssetRating.SUGGESTIVE_NUDITY /**/]:
    "This image may depict suggestive nudity.",
  [AssetRating.NOT_RATED /*        */]: ""
};

const Image = forwardRef<ImageProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    size,
    imgId,
    imgRef,
    hex,
    src,
    alt,
    rating,
    width,
    height,
    className,
    slotProps,
    style,
    children,
    ...rest
  } = props;
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [showOverlay, setShowOverlay] = React.useState<boolean>(
    typeof rating !== "undefined" &&
      [
        AssetRating.SENSITIVE,
        AssetRating.SUGGESTIVE_NUDITY,
        AssetRating.VIOLENCE
      ].includes(rating)
  );
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
          ...style
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
            onLoadingStatusChange={(status): void =>
              setLoaded(status === "loaded")
            }
            ref={imgRef}
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
        {showOverlay && (
          <div
            {...slotProps?.overlay}
            className={clsx(
              "force-dark-mode",
              "flex-col",
              "flex-center",
              styles.overlay,
              slotProps?.overlay?.className
            )}
          >
            <WarningIcon />
            <Spacer orientation={"vertical"} size={2.5} />
            <Typography as={"p"} level={"h4"}>
              Content warning
            </Typography>
            <Spacer orientation={"vertical"} size={0.5} />
            <Typography className={"t-medium"} level={"body2"}>
              {assetRatingDescriptionMap[rating!]}
            </Typography>
            <Spacer orientation={"vertical"} size={2} />
            <Button
              autoSize
              onClick={(): void => setShowOverlay(false)}
              variant={"hollow"}
            >
              View
            </Button>
          </div>
        )}
      </Component>
    </Root>
  );
});

Image.displayName = "Image";

export default Image;
