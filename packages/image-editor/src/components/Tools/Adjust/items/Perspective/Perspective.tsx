import React from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "~/components/Accordion";

import { AdjustTool } from "../constants";

const PerspectiveTool = (): React.ReactLayer => (
  <AccordionItem value={AdjustTool.PERSPECTIVE}>
    <AccordionTrigger>Perspective</AccordionTrigger>
    <AccordionContent>Content</AccordionContent>
  </AccordionItem>
);

export default PerspectiveTool;
