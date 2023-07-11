import React from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "~/components/Accordion";

import { AdjustTool } from "../constants";

const RotateTool = (): React.ReactElement => (
  <AccordionItem value={AdjustTool.ROTATE}>
    <AccordionTrigger>Rotate</AccordionTrigger>
    <AccordionContent>Content</AccordionContent>
  </AccordionItem>
);

export default RotateTool;
