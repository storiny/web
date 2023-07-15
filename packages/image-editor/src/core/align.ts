import { getMaximumGroups } from "./groups";
import { BoundingBox, getCommonBoundingBox } from "./layer/bounds";
import { newLayerWith } from "./layer/mutateLayer";
import { ExcalidrawLayer } from "./layer/types";

export interface Alignment {
  axis: "x" | "y";
  position: "start" | "center" | "end";
}

export const alignLayers = (
  selectedLayers: ExcalidrawLayer[],
  alignment: Alignment
): ExcalidrawLayer[] => {
  const groups: ExcalidrawLayer[][] = getMaximumGroups(selectedLayers);

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

const calculateTranslation = (
  group: ExcalidrawLayer[],
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
  } // else if (position === "center") {
  return {
    ...noTranslation,
    [axis]:
      (selectionBoundingBox[min] + selectionBoundingBox[max]) / 2 -
      (groupBoundingBox[min] + groupBoundingBox[max]) / 2
  };
};
