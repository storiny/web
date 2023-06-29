import {
  ToggleGroupMultipleProps,
  ToggleGroupSingleProps,
} from "@radix-ui/react-toggle-group";

import { PolymorphicProps } from "~/types/index";

export type ToggleGroupSize = "lg" | "md" | "sm" | "xs";
export type ToggleGroupType = "single" | "multiple";
export type ToggleGroupOrientation = "horizontal" | "vertical";

type ToggleGroupPrimitive = ToggleGroupMultipleProps | ToggleGroupSingleProps;

export type ToggleGroupProps = Omit<
  ToggleGroupPrimitive,
  "type" | "orientation"
> &
  PolymorphicProps<"div"> & {
    /**
     * The orientation of the component.
     * @default 'horizontal'
     */
    orientation?: ToggleGroupOrientation;
    /**
     * The size of the component.
     * @default 'md'
     */
    size?: ToggleGroupSize;
    /**
     * The type of the component. Determines whether a single
     * or multiple items can be pressed at a time.
     * @default 'single'
     */
    type?: ToggleGroupType;
  };
