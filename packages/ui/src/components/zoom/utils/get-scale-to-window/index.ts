/**
 * Calculates the scale factor to fit an image within the viewport, considering the zoom offset.
 * @param height The height of the image.
 * @param offset The zoom offset to apply.
 * @param width The width of the image.
 */
export const get_scale_to_window = ({
  height,
  offset,
  width
}: {
  height: number;
  offset: number;
  width: number;
}): number =>
  Math.min(
    (window.innerWidth - offset * 2) / width, // scale X-axis
    (window.innerHeight - offset * 2) / height // scale Y-axis
  );

/**
 * Calculates the scale factor to fit an image within the container while maintaining its aspect ratio.
 * @param container_height The height of the container.
 * @param container_width The width of the container.
 * @param offset The zoom offset to apply.
 * @param target_height The natural height of the target image.
 * @param target_width The natural width of the target image.
 */
export const get_scale_to_window_max = ({
  container_height,
  container_width,
  offset,
  target_height,
  target_width
}: {
  container_height: number;
  container_width: number;
  offset: number;
  target_height: number;
  target_width: number;
}): number => {
  const scale = get_scale_to_window({
    offset,
    height: target_height,
    width: target_width
  });
  const ratio =
    target_width > target_height
      ? target_width / container_width
      : target_height / container_height;

  return scale > 1 ? ratio : scale * ratio;
};
