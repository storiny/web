"use client";

import { useAtomValue } from "jotai";
import React from "react";

import Divider from "~/components/Divider";
import Spacer from "~/components/Spacer";

import { isPenModeAtom } from "../../../atoms";
import { LayerType } from "../../../constants";
import { useActiveObject, useCanvas } from "../../../hooks";
import Alignment from "./items/alignment";
import Dimensions from "./items/dimensions";
import Fill from "./items/fill";
import LayerProps from "./items/layer-props";
import ObjectProps from "./items/object-props";
import PenProps from "./items/pen-props";
import Position from "./items/position";
import Shadow from "./items/shadow";
import Skew from "./items/skew";
import Stroke from "./items/stroke";

const SpacerWithDivider = (): React.ReactElement => (
  <React.Fragment>
    <Spacer orientation={"vertical"} size={2} />
    <Divider />
    <Spacer orientation={"vertical"} size={2} />
  </React.Fragment>
);

const PenTools = ({
  isDrawing
}: {
  isDrawing: boolean;
}): React.ReactElement => (
  <React.Fragment>
    <Spacer orientation={"vertical"} size={1.5} />
    {!isDrawing && (
      <React.Fragment>
        <Position />
        <Dimensions />
        <Skew />
        <ObjectProps disableCornerRadius />
        <SpacerWithDivider />
      </React.Fragment>
    )}
    <PenProps />
    <SpacerWithDivider />
    <Shadow isPen />
    <Spacer orientation={"vertical"} size={2} />
    <Divider />
  </React.Fragment>
);

/**
 * Returns tools for active object
 * @param type Active object type
 */
const getActiveObjectTools = (type: LayerType): React.ReactElement | null => {
  switch (type) {
    case LayerType.RECTANGLE:
    case LayerType.DIAMOND:
    case LayerType.ELLIPSE:
      return (
        <React.Fragment>
          <Spacer orientation={"vertical"} size={1.5} />
          <Position />
          <Dimensions />
          <Skew />
          <ObjectProps />
          <SpacerWithDivider />
          <LayerProps />
          <SpacerWithDivider />
          <Fill />
          <SpacerWithDivider />
          <Stroke />
          <SpacerWithDivider />
          <Shadow />
          <Spacer orientation={"vertical"} size={2} />
          <Divider />
        </React.Fragment>
      );
    case LayerType.LINE:
    case LayerType.ARROW:
      return (
        <React.Fragment>
          <Spacer orientation={"vertical"} size={1.5} />
          <Position />
          <Skew />
          <SpacerWithDivider />
          <LayerProps />
          <SpacerWithDivider />
          <Stroke />
          <SpacerWithDivider />
          <Shadow />
          <Spacer orientation={"vertical"} size={2} />
          <Divider />
        </React.Fragment>
      );
    case LayerType.PEN:
      return <PenTools isDrawing={false} />;
    case LayerType.IMAGE:
      return (
        <React.Fragment>
          <Spacer orientation={"vertical"} size={1.5} />
          <Position />
          <Dimensions />
          <Skew />
          <ObjectProps disableCornerRadius />
          <SpacerWithDivider />
          <LayerProps disableRoughness />
          <SpacerWithDivider />
          <Stroke disableStrokeStyle />
          <SpacerWithDivider />
          <Shadow />
          <Spacer orientation={"vertical"} size={2} />
          <Divider />
        </React.Fragment>
      );
    default:
      return null;
  }
};

const DrawTools = (): React.ReactElement | null => {
  const canvas = useCanvas();
  const activeObject = useActiveObject();
  const isPenMode = useAtomValue(isPenModeAtom);

  return (
    <React.Fragment>
      <Alignment />
      {canvas.current?.isDrawingMode || isPenMode ? (
        <PenTools isDrawing={true} />
      ) : activeObject ? (
        getActiveObjectTools(activeObject.get("_type"))
      ) : null}
      <Spacer orientation={"vertical"} size={2} />
    </React.Fragment>
  );
};

export default DrawTools;
