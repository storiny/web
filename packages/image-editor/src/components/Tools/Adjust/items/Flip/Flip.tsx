import React from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "~/components/Accordion";

import { AdjustTool } from "../constants";

const FlipTool = (): React.ReactLayer => (
  <AccordionItem value={AdjustTool.FLIP}>
    <AccordionTrigger>Flip</AccordionTrigger>
    <AccordionContent>Content</AccordionContent>
  </AccordionItem>
);

export default FlipTool;
