import React from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "~/components/Accordion";

import { AdjustTool } from "../constants";

const HueTool = (): React.ReactElement => (
  <AccordionItem value={AdjustTool.HUE}>
    <AccordionTrigger>Hue</AccordionTrigger>
    <AccordionContent>Content</AccordionContent>
  </AccordionItem>
);

export default HueTool;
