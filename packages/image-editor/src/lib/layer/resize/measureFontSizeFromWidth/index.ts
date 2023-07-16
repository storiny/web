import { NonDeleted, TextLayer } from "../../../../types";
import { isBoundToContainer } from "../../predicates";

const MIN_FONT_SIZE = 1;

/**
 * Computes font size from width
 * @param layer Text layer
 * @param nextWidth New width
 * @param nextHeight New height
 */
export const measureFontSizeFromWidth = (
  layer: NonDeleted<TextLayer>,
  nextWidth: number,
  nextHeight: number
): { baseline: number; size: number } | null => {
  // We only use width to scale font on resize
  let width = layer.width;
  const hasContainer = isBoundToContainer(layer);

  if (hasContainer) {
    const container = getContainerLayer(layer);

    if (container) {
      width = getBoundTextMaxWidth(container);
    }
  }

  const nextFontSize = layer.fontSize * (nextWidth / width);

  if (nextFontSize < MIN_FONT_SIZE) {
    return null;
  }

  const metrics = measureText(
    layer.text,
    getFontString({ fontSize: nextFontSize, fontFamily: layer.fontFamily }),
    layer.lineHeight
  );

  return {
    size: nextFontSize,
    baseline: metrics.baseline + (nextHeight - metrics.height)
  };
};
