"use client";

import { Root } from "@radix-ui/react-toggle-group";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import clsx from "clsx";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./toggle-group.module.scss";
import { ToggleGroupProps } from "./toggle-group.props";
import { ToggleGroupContext } from "./toggle-group-context";

const ToggleGroup = forward_ref<ToggleGroupProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    size = "md",
    type = "single",
    orientation = "horizontal",
    className,
    children,
    ...rest
  } = props;
  return (
    // Disable hover-able content for seamless tooltip swap animation
    <TooltipProvider disableHoverableContent skipDelayDuration={1500}>
      <ToggleGroupContext.Provider value={{ size }}>
        <Root
          {...(rest as any)}
          asChild
          className={clsx(styles["toggle-group"], className)}
          orientation={orientation}
          ref={ref}
          type={type}
        >
          <Component>{children}</Component>
        </Root>
      </ToggleGroupContext.Provider>
    </TooltipProvider>
  );
});

ToggleGroup.displayName = "ToggleGroup";

export default ToggleGroup;
