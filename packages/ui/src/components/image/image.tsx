"use client";

import {
  Fallback,
  Image as ImagePrimitive,
  ImageLoadingStatus,
  Root
} from "@radix-ui/react-avatar";
import { AssetRating } from "@storiny/shared";
import clsx from "clsx";
import React from "react";

import Button from "~/components/button";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import WarningIcon from "~/icons/warning";
import { select_user } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";
import { get_cdn_url } from "~/utils/get-cdn-url";

import styles from "./image.module.scss";
import { ImageProps } from "./image.props";

const ASSET_RATING_DESCRIPTION_MAP: Record<AssetRating, string> = {
  [AssetRating.VIOLENCE /*         */]:
    "This image may contain violent content.",
  [AssetRating.SENSITIVE /*        */]:
    "This image may contain sensitive content.",
  [AssetRating.SUGGESTIVE_NUDITY /**/]:
    "This image may depict suggestive nudity.",
  [AssetRating.NOT_RATED /*        */]: ""
};

const Image = forward_ref<ImageProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    size,
    img_key,
    img_ref,
    hex,
    src,
    alt,
    rating,
    width,
    height,
    className,
    slot_props,
    style,
    children,
    ...rest
  } = props;
  const user = use_app_selector(select_user);
  const [status, set_status] = React.useState<ImageLoadingStatus>("loading");
  const [show_overlay, set_show_overlay] = React.useState<boolean>(
    typeof rating !== "undefined" &&
      [
        AssetRating.SENSITIVE,
        AssetRating.SUGGESTIVE_NUDITY,
        AssetRating.VIOLENCE
      ].includes(rating)
  );
  let final_src = src;

  if (img_key) {
    final_src = get_cdn_url(img_key, size);
  }

  React.useEffect(() => {
    if (user?.allow_sensitive_content) {
      set_show_overlay(false);
    }
  }, [user?.allow_sensitive_content]);

  return (
    <Root
      {...rest}
      asChild
      className={clsx(
        styles.image,
        status === "loaded" && styles.loaded,
        className
      )}
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
            {...slot_props?.image}
            alt={alt}
            className={clsx(
              styles["native-image"],
              slot_props?.image?.className
            )}
            onLoadingStatusChange={set_status}
            ref={img_ref}
            src={final_src}
          />
        )}
        {status === "error" && (
          <Fallback
            {...slot_props?.fallback}
            className={clsx(
              css["flex-center"],
              styles.fallback,
              slot_props?.fallback?.className
            )}
          >
            <Typography color={"minor"} level={"body2"}>
              Image not available
            </Typography>
          </Fallback>
        )}
        {show_overlay && (
          <div
            {...slot_props?.overlay}
            className={clsx(
              "force-dark-mode",
              css["flex-col"],
              css["flex-center"],
              styles.overlay,
              slot_props?.overlay?.className
            )}
          >
            <WarningIcon />
            <Spacer orientation={"vertical"} size={2.5} />
            <Typography as={"p"} level={"h4"}>
              Content warning
            </Typography>
            <Spacer orientation={"vertical"} size={0.5} />
            <Typography level={"body2"} weight={"medium"}>
              {ASSET_RATING_DESCRIPTION_MAP[rating!]}
            </Typography>
            <Spacer orientation={"vertical"} size={2} />
            <Button
              auto_size
              onClick={(): void => set_show_overlay(false)}
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
