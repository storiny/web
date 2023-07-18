import { Layer } from "../../types";
import { getMaximumGroups } from "../group";
import { BoundingBox, getCommonBoundingBox, newLayerWith } from "../layer";

export interface Alignment {
  axis: "x" | "y";
  position: "start" | "center" | "end";
}

/**
 * Computes translation
 * @param group Group
 * @param selectionBoundingBox Selection bounding box
 * @param axis Axis
 * @param position Position
 */
const calculateTranslation = (
  group: Layer[],
  selectionBoundingBox: BoundingBox,
  { axis, position }: Alignment
): { x: number; y: number } => {
  const groupBoundingBox = getCommonBoundingBox(group);
  const [min, max]: ["minX" | "minY", "maxX" | "maxY"] =
    axis === "x" ? ["minX", "maxX"] : ["minY", "maxY"];
  const noTranslation = { x: 0, y: 0 };

  if (position === "start") {
    return {
      ...noTranslation,
      [axis]: selectionBoundingBox[min] - groupBoundingBox[min]
    };
  } else if (position === "end") {
    return {
      ...noTranslation,
      [axis]: selectionBoundingBox[max] - groupBoundingBox[max]
    };
  }

  return {
    ...noTranslation,
    [axis]:
      (selectionBoundingBox[min] + selectionBoundingBox[max]) / 2 -
      (groupBoundingBox[min] + groupBoundingBox[max]) / 2
  };
};

/**
 * Aligns layers
 * @param selectedLayers Selected layers
 * @param alignment Alignment
 */
export const alignLayers = (
  selectedLayers: Layer[],
  alignment: Alignment
): Layer[] => {
  const groups: Layer[][] = getMaximumGroups(selectedLayers);
  const selectionBoundingBox = getCommonBoundingBox(selectedLayers);

  return groups.flatMap((group) => {
    const translation = calculateTranslation(
      group,
      selectionBoundingBox,
      alignment
    );

    return group.map((layer) =>
      newLayerWith(layer, {
        x: layer.x + translation.x,
        y: layer.y + translation.y
      })
    );
  });
};
