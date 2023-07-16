import { ImageMime } from "../../../../constants";
import { SVG_NS } from "../../../../constants/new";
import { isHTMLSVGElement } from "../isHTMLSVGElement";

/**
 * Normalizes an SVG
 * @param svgString SVG string
 */
export const normalizeSVG = async (svgString: string): Promise<string> => {
  const doc = new DOMParser().parseFromString(svgString, ImageMime.SVG);
  const svg = doc.querySelector("svg");
  const errorNode = doc.querySelector("parsererror");

  if (errorNode || !isHTMLSVGElement(svg)) {
    throw new Error("Invalid SVG");
  } else {
    if (!svg.hasAttribute("xmlns")) {
      svg.setAttribute("xmlns", SVG_NS);
    }

    if (!svg.hasAttribute("width") || !svg.hasAttribute("height")) {
      const viewBox = svg.getAttribute("viewBox");
      let width = svg.getAttribute("width") || "50";
      let height = svg.getAttribute("height") || "50";

      if (viewBox) {
        const match = viewBox.match(/\d+ +\d+ +(\d+) +(\d+)/);
        if (match) {
          [, width, height] = match;
        }
      }

      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
    }

    return svg.outerHTML;
  }
};
