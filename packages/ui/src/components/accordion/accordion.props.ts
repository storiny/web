import { Accordion } from "radix-ui";
import React from "react";

import { SvgIconProps } from "~/components/svg-icon";
import { PolymorphicProps } from "~/types/index";

export type AccordionProps = (
  | Accordion.AccordionSingleProps
  | Accordion.AccordionMultipleProps
) &
  PolymorphicProps<"div">;

export type AccordionItemProps = Accordion.AccordionItemProps &
  PolymorphicProps<"div">;

export type AccordionHeaderProps = Accordion.AccordionHeaderProps &
  PolymorphicProps<"h3">;

export type AccordionTriggerProps = Accordion.AccordionTriggerProps &
  PolymorphicProps<"button"> & {
    /**
     * The props passed to the individual component elements.
     */
    slot_props?: {
      header?: AccordionHeaderProps;
      icon?: SvgIconProps;
    };
  };

export type AccordionContentProps = Accordion.AccordionContentProps &
  PolymorphicProps<"div"> & {
    /**
     * The props passed to the individual component elements.
     */
    slot_props?: {
      wrapper?: React.ComponentPropsWithoutRef<"div">;
    };
  };
