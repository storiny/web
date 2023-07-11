import React from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "~/components/Accordion";

import { AdjustTool } from "../constants";

const ResizeTool = (): React.ReactElement => (
  <AccordionItem value={AdjustTool.RESIZE}>
    <AccordionTrigger>Resize</AccordionTrigger>
    <AccordionContent>Content</AccordionContent>
  </AccordionItem>
);

export default ResizeTool;
