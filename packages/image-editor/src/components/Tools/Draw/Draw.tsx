"use client";

import React from "react";

import Divider from "~/components/Divider";
import Spacer from "~/components/Spacer";

import { LayerType } from "../../../constants";
import { useActiveObject } from "../../../hooks";
import Alignment from "./items/Alignment";
import Dimensions from "./items/Dimensions";
import Fill from "./items/Fill";
import LayerProps from "./items/LayerProps";
import ObjectProps from "./items/ObjectProps";
import Position from "./items/Position";
import Shadow from "./items/Shadow";
import Skew from "./items/Skew";
import Stroke from "./items/Stroke";

const SpacerWithDivider = (): React.ReactElement => (
  <React.Fragment>
    <Spacer orientation={"vertical"} size={2} />
    <Divider />
    <Spacer orientation={"vertical"} size={2} />
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
    default:
      return null;
  }
};

const DrawTools = (): React.ReactElement | null => {
  const activeObject = useActiveObject();

  return (
    <React.Fragment>
      <Alignment />
      {activeObject && getActiveObjectTools(activeObject.get("_type"))}
      <Spacer orientation={"vertical"} size={2} />
    </React.Fragment>
  );
};

export default DrawTools;
