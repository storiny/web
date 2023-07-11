"use client";

import React from "react";

import Accordion from "~/components/Accordion";

import BrightnessTool from "./items/Brightness";
import ContrastTool from "./items/Contrast";
import CurvesTool from "./items/Curves";
import FlipTool from "./items/Flip";
import HueTool from "./items/Hue";
import PerspectiveTool from "./items/Perspective";
import ResizeTool from "./items/Resize";
import RotateTool from "./items/Rotate";
import SaturationTool from "./items/Saturation";

const AdjustTools = (): React.ReactElement => (
  <Accordion type={"multiple"}>
    <ResizeTool />
    <RotateTool />
    <FlipTool />
    <BrightnessTool />
    <ContrastTool />
    <HueTool />
    <SaturationTool />
    <CurvesTool />
    <PerspectiveTool />
  </Accordion>
);

export default AdjustTools;
