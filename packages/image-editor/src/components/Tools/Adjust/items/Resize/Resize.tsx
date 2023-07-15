import React from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "~/components/Accordion";

import { AdjustTool } from "../constants";

const ResizeTool = (): React.ReactLayer => (
  <AccordionItem value={AdjustTool.RESIZE}>
    <AccordionTrigger>Resize</AccordionTrigger>
    <AccordionContent>Content</AccordionContent>
  </AccordionItem>
);

export default ResizeTool;
