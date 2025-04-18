import React from "react";

import { SupportedZoomImage } from "~/components/zoom/types";
import { get_scale, parse_position, test_div } from "~/components/zoom/utils";

const SRC_SVG_REGEX = /\.svg$/i;

/**
 * Calculates the style for a regular image element without object-fit or background styling.
 * @param container_height The height of the image container.
 * @param container_left The left offset of the image container.
 * @param container_top The top offset of the image container.
 * @param container_width The width of the image container.
 * @param has_scalable_src Whether the image source is scalable (e.g., SVG).
 * @param offset The zoom offset to apply.
 * @param target_height The natural height of the target image.
 * @param target_width The natural width of the target image.
 */
export const get_img_regular_style = ({
  container_height,
  container_left,
  container_top,
  container_width,
  has_scalable_src,
  offset,
  target_height,
  target_width
}: {
  container_height: number;
  container_left: number;
  container_top: number;
  container_width: number;
  has_scalable_src: boolean;
  offset: number;
  target_height: number;
  target_width: number;
}): React.CSSProperties => {
  const scale = get_scale({
    container_height,
    container_width,
    has_scalable_src,
    offset,
    target_height,
    target_width
  });

  return {
    top: container_top,
    left: container_left,
    width: container_width * scale,
    height: container_height * scale,
    transform: `translate(0,0) scale(${1 / scale})`
  };
};

/**
 * Calculates the style for an image element with object-fit styling applied.
 * @param container_height The height of the image container.
 * @param container_left The left offset of the image container.
 * @param container_top The top offset of the image container.
 * @param container_width The width of the image container.
 * @param has_scalable_src Whether the image source is scalable (e.g., SVG).
 * @param object_fit The CSS object-fit value of the image.
 * @param object_position The CSS object-position value of the image.
 * @param offset The zoom offset to apply.
 * @param target_height The natural height of the target image.
 * @param target_width The natural width of the target image.
 */
export const get_img_object_fit_style = ({
  container_height,
  container_left,
  container_top,
  container_width,
  has_scalable_src,
  object_fit,
  object_position,
  offset,
  target_height,
  target_width
}: {
  container_height: number;
  container_left: number;
  container_top: number;
  container_width: number;
  has_scalable_src: boolean;
  object_fit: string;
  object_position: string;
  offset: number;
  target_height: number;
  target_width: number;
}): React.CSSProperties => {
  if (object_fit === "scale-down") {
    if (target_width <= container_width && target_height <= container_height) {
      object_fit = "none";
    } else {
      object_fit = "contain";
    }
  }

  if (object_fit === "cover" || object_fit === "contain") {
    const width_ratio = container_width / target_width;
    const height_ratio = container_height / target_height;

    const ratio =
      object_fit === "cover"
        ? Math.max(width_ratio, height_ratio)
        : Math.min(width_ratio, height_ratio);

    const [pos_left = "50%", pos_top = "50%"] = object_position.split(" ");
    const pos_x = parse_position({
      position: pos_left,
      relative_num: container_width - target_width * ratio
    });
    const pos_y = parse_position({
      position: pos_top,
      relative_num: container_height - target_height * ratio
    });

    const scale = get_scale({
      container_height: target_height * ratio,
      container_width: target_width * ratio,
      has_scalable_src,
      offset,
      target_height,
      target_width
    });

    return {
      top: container_top + pos_y,
      left: container_left + pos_x,
      width: target_width * ratio * scale,
      height: target_height * ratio * scale,
      transform: `translate(0,0) scale(${1 / scale})`
    };
  } else if (object_fit === "none") {
    const [pos_left = "50%", pos_top = "50%"] = object_position.split(" ");
    const pos_x = parse_position({
      position: pos_left,
      relative_num: container_width - target_width
    });
    const pos_y = parse_position({
      position: pos_top,
      relative_num: container_height - target_height
    });

    const scale = get_scale({
      container_height: target_height,
      container_width: target_width,
      has_scalable_src,
      offset,
      target_height,
      target_width
    });

    return {
      top: container_top + pos_y,
      left: container_left + pos_x,
      width: target_width * scale,
      height: target_height * scale,
      transform: `translate(0,0) scale(${1 / scale})`
    };
  } else if (object_fit === "fill") {
    const width_ratio = container_width / target_width;
    const height_ratio = container_height / target_height;
    const ratio = Math.max(width_ratio, height_ratio);

    const scale = get_scale({
      container_height: target_height * ratio,
      container_width: target_width * ratio,
      has_scalable_src,
      offset,
      target_height,
      target_width
    });

    return {
      width: container_width * scale,
      height: container_height * scale,
      transform: `translate(0,0) scale(${1 / scale})`
    };
  }

  return {};
};

/**
 * Calculates the style for a div element styled with a background image.
 * @param background_position The CSS background-position value.
 * @param background_size The CSS background-size value.
 * @param container_height The height of the image container.
 * @param container_left The left offset of the image container.
 * @param container_top The top offset of the image container.
 * @param container_width The width of the image container.
 * @param has_scalable_src Whether the background image source is scalable (e.g., SVG).
 * @param offset The zoom offset to apply.
 * @param target_height The natural height of the background image.
 * @param target_width The natural width of the background image.
 */
export const get_div_img_style = ({
  background_position,
  background_size,
  container_height,
  container_left,
  container_top,
  container_width,
  has_scalable_src,
  offset,
  target_height,
  target_width
}: {
  background_position: string;
  background_size: string;
  container_height: number;
  container_left: number;
  container_top: number;
  container_width: number;
  has_scalable_src: boolean;
  offset: number;
  target_height: number;
  target_width: number;
}): React.CSSProperties => {
  if (background_size === "cover" || background_size === "contain") {
    const width_ratio = container_width / target_width;
    const height_ratio = container_height / target_height;

    const ratio =
      background_size === "cover"
        ? Math.max(width_ratio, height_ratio)
        : Math.min(width_ratio, height_ratio);

    const [pos_left = "50%", pos_top = "50%"] = background_position.split(" ");
    const pos_x = parse_position({
      position: pos_left,
      relative_num: container_width - target_width * ratio
    });
    const pos_y = parse_position({
      position: pos_top,
      relative_num: container_height - target_height * ratio
    });

    const scale = get_scale({
      container_height: target_height * ratio,
      container_width: target_width * ratio,
      has_scalable_src,
      offset,
      target_height,
      target_width
    });

    return {
      top: container_top + pos_y,
      left: container_left + pos_x,
      width: target_width * ratio * scale,
      height: target_height * ratio * scale,
      transform: `translate(0,0) scale(${1 / scale})`
    };
  } else if (background_size === "auto") {
    const [pos_left = "50%", pos_top = "50%"] = background_position.split(" ");
    const pos_x = parse_position({
      position: pos_left,
      relative_num: container_width - target_width
    });
    const pos_y = parse_position({
      position: pos_top,
      relative_num: container_height - target_height
    });

    const scale = get_scale({
      container_height: target_height,
      container_width: target_width,
      has_scalable_src,
      offset,
      target_height,
      target_width
    });

    return {
      top: container_top + pos_y,
      left: container_left + pos_x,
      width: target_width * scale,
      height: target_height * scale,
      transform: `translate(0,0) scale(${1 / scale})`
    };
  } else {
    const [size_w = "50%", size_h = "50%"] = background_size.split(" ");
    const size_width = parse_position({
      position: size_w,
      relative_num: container_width
    });
    const size_height = parse_position({
      position: size_h,
      relative_num: container_height
    });

    const width_ratio = size_width / target_width;
    const height_ratio = size_height / target_height;
    const ratio = Math.min(width_ratio, height_ratio);
    const [pos_left = "50%", pos_top = "50%"] = background_position.split(" ");

    const pos_x = parse_position({
      position: pos_left,
      relative_num: container_width - target_width * ratio
    });
    const pos_y = parse_position({
      position: pos_top,
      relative_num: container_height - target_height * ratio
    });

    const scale = get_scale({
      container_height: target_height * ratio,
      container_width: target_width * ratio,
      has_scalable_src,
      offset,
      target_height,
      target_width
    });

    return {
      top: container_top + pos_y,
      left: container_left + pos_x,
      width: target_width * ratio * scale,
      height: target_height * ratio * scale,
      transform: `translate(0,0) scale(${1 / scale})`
    };
  }
};

/**
 * Determines and returns the correct style for rendering the zoomed modal image.
 * @param has_zoom_img Whether a zoom-specific image is available.
 * @param img_src The source of the image.
 * @param is_zoomed Whether the image is currently zoomed.
 * @param loaded_img_element The loaded <img> element reference.
 * @param offset The zoom offset to apply.
 * @param should_refresh Whether the transform should be refreshed (e.g., on resize).
 * @param target_element The original image or div element that was clicked.
 */
export const get_modal_img_style = ({
  has_zoom_img,
  img_src,
  is_zoomed,
  loaded_img_element,
  offset,
  should_refresh,
  target_element
}: {
  has_zoom_img: boolean;
  img_src: string | undefined;
  is_zoomed: boolean;
  loaded_img_element: HTMLImageElement | undefined;
  offset: number;
  should_refresh: boolean;
  target_element: SupportedZoomImage;
}): React.CSSProperties => {
  const has_scalable_src =
    img_src?.slice?.(0, 18) === "data:image/svg+xml" ||
    has_zoom_img ||
    !!(img_src && SRC_SVG_REGEX.test(img_src));

  const img_rect = target_element.getBoundingClientRect();
  const target_element_computed_style = window.getComputedStyle(target_element);

  const is_div_img = loaded_img_element != null && test_div(target_element);
  const is_img_object_fit = loaded_img_element != null && !is_div_img;

  const img_regular_style = get_img_regular_style({
    container_height: img_rect.height,
    container_left: img_rect.left,
    container_top: img_rect.top,
    container_width: img_rect.width,
    has_scalable_src,
    offset,
    target_height: loaded_img_element?.naturalHeight || img_rect.height,
    target_width: loaded_img_element?.naturalWidth || img_rect.width
  });

  const img_object_fit_style = is_img_object_fit
    ? get_img_object_fit_style({
        container_height: img_rect.height,
        container_left: img_rect.left,
        container_top: img_rect.top,
        container_width: img_rect.width,
        has_scalable_src,
        object_fit: target_element_computed_style.objectFit,
        object_position: target_element_computed_style.objectPosition,
        offset,
        target_height: loaded_img_element?.naturalHeight || img_rect.height,
        target_width: loaded_img_element?.naturalWidth || img_rect.width
      })
    : undefined;

  const div_img_style = is_div_img
    ? get_div_img_style({
        background_position: target_element_computed_style.backgroundPosition,
        background_size: target_element_computed_style.backgroundSize,
        container_height: img_rect.height,
        container_left: img_rect.left,
        container_top: img_rect.top,
        container_width: img_rect.width,
        has_scalable_src,
        offset,
        target_height: loaded_img_element?.naturalHeight || img_rect.height,
        target_width: loaded_img_element?.naturalWidth || img_rect.width
      })
    : undefined;

  const style = Object.assign(
    {},
    img_regular_style,
    img_object_fit_style,
    div_img_style
  );

  if (is_zoomed) {
    const viewport_x = window.innerWidth / 2;
    const viewport_y = window.innerHeight / 2;

    const child_center_x =
      parseFloat(String(style.left || 0)) +
      parseFloat(String(style.width || 0)) / 2;
    const child_center_y =
      parseFloat(String(style.top || 0)) +
      parseFloat(String(style.height || 0)) / 2;

    const translate_x = viewport_x - child_center_x;
    const translate_y = viewport_y - child_center_y;

    // For scenarios like resizing the browser window
    if (should_refresh) {
      style.transitionDuration = "0.01ms";
    }

    style.transform = `translate(${translate_x}px,${translate_y}px) scale(1)`;
  }

  return style;
};
