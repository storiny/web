import { SupportedZoomImage } from "~/components/zoom/types";
import { test_div, test_img } from "~/components/zoom/utils";

// noinspection RegExpUnnecessaryNonCapturingGroup
const URL_REGEX = /url(?:\(['"]?)(.*?)(?:['"]?\))/;

/**
 * Extracts the image source URL from an image or a div with a background image.
 * @param img_element The image element to extract the source from.
 */
export const get_img_src = (
  img_element: SupportedZoomImage | null
): string | undefined => {
  if (img_element) {
    if (test_img(img_element)) {
      return img_element.currentSrc;
    }

    if (test_div(img_element)) {
      const bg_img = window.getComputedStyle(img_element).backgroundImage;

      if (bg_img) {
        return URL_REGEX.exec(bg_img)?.[1];
      }
    }
  }
};
