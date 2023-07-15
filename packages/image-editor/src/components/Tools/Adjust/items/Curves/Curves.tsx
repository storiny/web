import React from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "~/components/Accordion";

import { AdjustTool } from "../constants";

const CurvesTool = (): React.ReactLayer => (
  <AccordionItem value={AdjustTool.CURVES}>
    <AccordionTrigger>Curves</AccordionTrigger>
    <AccordionContent>Content</AccordionContent>
  </AccordionItem>
);

export default CurvesTool;
