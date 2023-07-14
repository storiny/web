import { BoundingBox, getCommonBoundingBox } from "./element/bounds";
import { newElementWith } from "./element/mutateElement";
import { ExcalidrawElement } from "./element/types";
import { getMaximumGroups } from "./groups";

export interface Alignment {
  axis: "x" | "y";
  position: "start" | "center" | "end";
}

const calculateTranslation = (
  group: ExcalidrawElement[],
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

export const alignElements = (
  selectedElements: ExcalidrawElement[],
  alignment: Alignment
): ExcalidrawElement[] => {
  const groups: ExcalidrawElement[][] = getMaximumGroups(selectedElements);

  const selectionBoundingBox = getCommonBoundingBox(selectedElements);

  return groups.flatMap((group) => {
    const translation = calculateTranslation(
      group,
      selectionBoundingBox,
      alignment
    );
    return group.map((element) =>
      newElementWith(element, {
        x: element.x + translation.x,
        y: element.y + translation.y
      })
    );
  });
};
