import { filters } from "fabric";
import React from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "~/components/accordion";
import Slider from "~/components/slider";

import { use_active_object, use_image_filter } from "../../../../../hooks";
import { is_image_object } from "../../../../../utils";
import { Filter } from "../constants";

const BrightnessTool = (): React.ReactElement | null => {
  const active_image = use_active_object();
  const { value, set_value } = use_image_filter(
    filters.Brightness,
    "brightness"
  );

  if (!active_image || !is_image_object(active_image)) {
    return null;
  }

  return (
    <AccordionItem value={Filter.BRIGHTNESS}>
      <AccordionTrigger>Brightness</AccordionTrigger>
      <AccordionContent>
        <Slider
          max={100}
          min={-100}
          onValueChange={([next_value]: number[]): void => {
            set_value(next_value / 100);
          }}
          step={1}
          value={[value * 100]}
        />
      </AccordionContent>
    </AccordionItem>
  );
};

export default BrightnessTool;
