import {
  get_scale_to_window,
  get_scale_to_window_max
} from "~/components/zoom/utils";

/**
 * Calculates the scale factor for an image based on the container size, target image size, and zoom offset.
 * @param container_height The height of the container.
 * @param container_width The width of the container.
 * @param has_scalable_src Whether the image source is scalable (e.g., SVG).
 * @param offset The zoom offset to apply.
 * @param target_height The natural height of the target image.
 * @param target_width The natural width of the target image.
 */
export const get_scale = ({
  container_height,
  container_width,
  has_scalable_src,
  offset,
  target_height,
  target_width
}: {
  container_height: number;
  container_width: number;
  has_scalable_src: boolean;
  offset: number;
  target_height: number;
  target_width: number;
}): number => {
  if (!container_height || !container_width) {
    return 1;
  }

  return !has_scalable_src && target_height && target_width
    ? get_scale_to_window_max({
        container_height,
        container_width,
        offset,
        target_height,
        target_width
      })
    : get_scale_to_window({
        height: container_height,
        offset,
        width: container_width
      });
};
