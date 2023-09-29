"use client";

import React from "react";

import { As, ComponentWithAs, PropsOf, RightJoinProps } from "~/types/index";

/**
 * Extended version of React's `forwardRef` for polymorphic components
 * @param component Polymorphic component
 */
export const forward_ref = <Props extends object, Component extends As>(
  component: React.ForwardRefRenderFunction<
    any,
    RightJoinProps<PropsOf<Component>, Props> & {
      as?: As;
    }
  >
): ComponentWithAs<Component, Props> =>
  React.forwardRef(component) as unknown as ComponentWithAs<Component, Props>;
