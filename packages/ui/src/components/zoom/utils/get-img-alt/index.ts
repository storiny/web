import { SupportedZoomImage } from "~/components/zoom/types";
import { test_img } from "~/components/zoom/utils";

/**
 * Retrieves the accessible label from an image element, using `alt` for standard images or `aria-label` for custom elements.
 * @param img_element The image element to extract the label from.
 */
export const get_img_alt = (
  img_element: SupportedZoomImage | null
): string | undefined => {
  if (img_element) {
    if (test_img(img_element)) {
      return img_element.alt ?? undefined;
    }

    return img_element.getAttribute("aria-label") ?? undefined;
  }
};
