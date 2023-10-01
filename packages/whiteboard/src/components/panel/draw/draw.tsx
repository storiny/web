"use client";

import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Divider from "~/components/divider";
import Spacer from "~/components/spacer";

import { is_pen_mode_atom } from "../../../atoms";
import { LayerType } from "../../../constants";
import { use_active_object, use_canvas } from "../../../hooks";
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
        <ObjectProps disable_corner_radius />
        <SpacerWithDivider />
      </React.Fragment>
    )}
    <PenProps />
    <SpacerWithDivider />
    <Shadow is_pen />
    <Spacer orientation={"vertical"} size={2} />
    <Divider />
  </React.Fragment>
);

/**
 * Returns tools for active object
 * @param type Active object type
 */
const get_active_object_tools = (
  type: LayerType
): React.ReactElement | null => {
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
          <ObjectProps disable_corner_radius />
          <SpacerWithDivider />
          <LayerProps disable_roughness />
          <SpacerWithDivider />
          <Stroke disable_stroke_style />
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
  const canvas = use_canvas();
  const active_object = use_active_object();
  const is_pen_mode = use_atom_value(is_pen_mode_atom);

  return (
    <React.Fragment>
      <Alignment />
      {canvas.current?.isDrawingMode || is_pen_mode ? (
        <PenTools isDrawing={true} />
      ) : active_object ? (
        get_active_object_tools(active_object.get("_type"))
      ) : null}
      <Spacer orientation={"vertical"} size={2} />
    </React.Fragment>
  );
};

export default DrawTools;
