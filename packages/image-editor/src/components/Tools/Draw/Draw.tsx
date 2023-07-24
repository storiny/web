"use client";

import React from "react";

import Divider from "~/components/Divider";
import Spacer from "~/components/Spacer";

import Dimensions from "./items/Dimensions";
import Fill from "./items/Fill";
import LayerProps from "./items/LayerProps";
import ObjectProps from "./items/ObjectProps";
import Position from "./items/Position";
import Stroke from "./items/Stroke";

const DrawTools = (): React.ReactElement => (
  <>
    <Spacer orientation={"vertical"} size={1.5} />
    <Position />
    <Dimensions />
    <ObjectProps />
    <Spacer orientation={"vertical"} size={1.5} />
    <Divider />
    <Spacer orientation={"vertical"} size={1.5} />
    <LayerProps />
    <Spacer orientation={"vertical"} size={1.5} />
    <Divider />
    <Spacer orientation={"vertical"} size={1.5} />
    <Fill />
    <Spacer orientation={"vertical"} size={1.5} />
    <Divider />
    <Spacer orientation={"vertical"} size={1.5} />
    <Stroke />
  </>
);

export default DrawTools;
