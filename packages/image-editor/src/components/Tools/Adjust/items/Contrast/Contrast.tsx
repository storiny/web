import React from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "~/components/Accordion";

import { AdjustTool } from "../constants";

const ContrastTool = (): React.ReactElement => (
  <AccordionItem value={AdjustTool.CONTRAST}>
    <AccordionTrigger>Contrast</AccordionTrigger>
    <AccordionContent>Content</AccordionContent>
  </AccordionItem>
);

export default ContrastTool;
