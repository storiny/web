import React from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "~/components/Accordion";

import { AdjustTool } from "../constants";

const FlipTool = (): React.ReactElement => (
  <AccordionItem value={AdjustTool.FLIP}>
    <AccordionTrigger>Flip</AccordionTrigger>
    <AccordionContent>Content</AccordionContent>
  </AccordionItem>
);

export default FlipTool;
