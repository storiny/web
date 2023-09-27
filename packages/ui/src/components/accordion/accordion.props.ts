import {
  AccordionContentProps as AccordionContentPrimitiveProps,
  AccordionHeaderProps as AccordionHeaderPrimitiveProps,
  AccordionItemProps as AccordionItemPrimitiveProps,
  AccordionMultipleProps,
  AccordionSingleProps,
  AccordionTriggerProps as AccordionTriggerPrimitiveProps
} from "@radix-ui/react-accordion";
import React from "react";

import { SvgIconProps } from "~/components/SvgIcon";
import { PolymorphicProps } from "~/types/index";

export type AccordionProps = (AccordionSingleProps | AccordionMultipleProps) &
  PolymorphicProps<"div">;

export type AccordionItemProps = AccordionItemPrimitiveProps &
  PolymorphicProps<"div">;

export type AccordionHeaderProps = AccordionHeaderPrimitiveProps &
  PolymorphicProps<"h3">;

export type AccordionTriggerProps = AccordionTriggerPrimitiveProps &
  PolymorphicProps<"button"> & {
    /**
     * The props passed to the individual component elements.
     */
    slot_props?: {
      header?: AccordionHeaderProps;
      icon?: SvgIconProps;
    };
  };

export type AccordionContentProps = AccordionContentPrimitiveProps &
  PolymorphicProps<"div"> & {
    /**
     * The props passed to the individual component elements.
     */
    slot_props?: {
      wrapper?: React.ComponentPropsWithoutRef<"div">;
    };
  };
