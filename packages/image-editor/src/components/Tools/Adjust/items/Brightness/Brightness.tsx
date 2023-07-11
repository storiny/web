import React from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "~/components/Accordion";

import { AdjustTool } from "../constants";

const BrightnessTool = (): React.ReactElement => (
  <AccordionItem value={AdjustTool.BRIGHTNESS}>
    <AccordionTrigger>Brightness</AccordionTrigger>
    <AccordionContent>Content</AccordionContent>
  </AccordionItem>
);

export default BrightnessTool;
