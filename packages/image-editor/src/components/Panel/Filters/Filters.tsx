"use client";

import React from "react";

import Accordion from "~/components/Accordion";

import BrightnessTool from "./items/Brightness";

const FiltersTools = (): React.ReactElement => (
  <Accordion type={"multiple"}>
    <BrightnessTool />
  </Accordion>
);

export default FiltersTools;
