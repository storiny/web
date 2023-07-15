import React from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "~/components/Accordion";

import { AdjustTool } from "../constants";

const SaturationTool = (): React.ReactLayer => (
  <AccordionItem value={AdjustTool.SATURATION}>
    <AccordionTrigger>Saturation</AccordionTrigger>
    <AccordionContent>Content</AccordionContent>
  </AccordionItem>
);

export default SaturationTool;
