import { filters } from "fabric";
import React from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "../../../../../../../ui/src/components/accordion";
import Slider from "~/components/Slider";

import { useActiveObject, useImageFilter } from "../../../../../hooks";
import { isImageObject } from "../../../../../utils";
import { Filter } from "../constants";

const BrightnessTool = (): React.ReactElement | null => {
  const activeImage = useActiveObject();
  const { value, setValue } = useImageFilter(filters.Brightness, "brightness");

  if (!activeImage || !isImageObject(activeImage)) {
    return null;
  }

  return (
    <AccordionItem value={Filter.BRIGHTNESS}>
      <AccordionTrigger>Brightness</AccordionTrigger>
      <AccordionContent>
        <Slider
          max={100}
          min={-100}
          onValueChange={([newValue]): void => {
            setValue(newValue / 100);
          }}
          step={1}
          value={[value * 100]}
        />
      </AccordionContent>
    </AccordionItem>
  );
};

export default BrightnessTool;
