/**
 * Returns the element's block margin
 * @param element Element
 * @param margin Margin type
 */
const getMargin = (
  element: Element | null,
  margin: "marginTop" | "marginBottom"
): number =>
  element ? parseFloat(window.getComputedStyle(element)[margin]) : 0;

/**
 * Returns the collapsed element margins
 * @param element Element
 */
export const getCollapsedMargins = (
  element: HTMLElement
): {
  marginBottom: number;
  marginTop: number;
} => {
  const { marginTop, marginBottom } = window.getComputedStyle(element);
  const prevElemSiblingMarginBottom = getMargin(
    element.previousElementSibling,
    "marginBottom"
  );
  const nextElemSiblingMarginTop = getMargin(
    element.nextElementSibling,
    "marginTop"
  );
  const collapsedTopMargin = Math.max(
    parseFloat(marginTop),
    prevElemSiblingMarginBottom
  );
  const collapsedBottomMargin = Math.max(
    parseFloat(marginBottom),
    nextElemSiblingMarginTop
  );

  return { marginBottom: collapsedBottomMargin, marginTop: collapsedTopMargin };
};
