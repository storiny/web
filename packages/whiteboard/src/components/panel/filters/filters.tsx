"use client";

import React from "react";

import Accordion from "../../../../../ui/src/components/accordion";

import BrightnessTool from "./items/brightness";

const FiltersTools = (): React.ReactElement => (
  <Accordion type={"multiple"}>
    <BrightnessTool />
  </Accordion>
);

export default FiltersTools;
