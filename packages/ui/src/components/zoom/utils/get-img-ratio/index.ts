import { SupportedZoomImage } from "~/components/zoom/types";

/**
 * Retrieves the aspect ratio of an image element.
 * @param img_element The image element to extract the ratio from.
 */
export const get_img_ratio = (
  img_element: SupportedZoomImage | null
): number | undefined => {
  if (img_element) {
    const width = Number.parseInt(
      img_element.getAttribute("data-width") || "0"
    );
    const height = Number.parseInt(
      img_element.getAttribute("data-height") || "0"
    );

    return width / height;
  }
};
