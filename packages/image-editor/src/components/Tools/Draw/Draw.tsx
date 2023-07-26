"use client";

import React from "react";

import Divider from "~/components/Divider";
import Spacer from "~/components/Spacer";

import { useActiveObject } from "../../../store";
import Dimensions from "./items/Dimensions";
import Fill from "./items/Fill";
import LayerProps from "./items/LayerProps";
import ObjectProps from "./items/ObjectProps";
import Position from "./items/Position";
import Stroke from "./items/Stroke";

const DrawTools = (): React.ReactElement => {
  const activeObject = useActiveObject();
  return (
    <React.Fragment key={activeObject?.get("id")}>
      <Spacer orientation={"vertical"} size={2} />
      <Position />
      <Dimensions />
      <ObjectProps />
      <Spacer orientation={"vertical"} size={2} />
      <Divider />
      <Spacer orientation={"vertical"} size={2} />
      <LayerProps />
      <Spacer orientation={"vertical"} size={2} />
      <Divider />
      <Spacer orientation={"vertical"} size={2} />
      <Fill />
      <Spacer orientation={"vertical"} size={2} />
      <Divider />
      <Spacer orientation={"vertical"} size={2} />
      <Stroke />
      <Spacer orientation={"vertical"} size={2} />
    </React.Fragment>
  );
};

export default DrawTools;
