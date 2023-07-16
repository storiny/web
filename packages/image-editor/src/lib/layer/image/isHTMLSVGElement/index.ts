/**
 * Predicate function for determining SVG elements
 * @param node Node to test
 */
export const isHTMLSVGElement = (node: Node | null): node is SVGElement =>
  node?.nodeName.toLowerCase() === "svg";
