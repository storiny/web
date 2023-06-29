"use client";

import React from "react";

import SvgIcon, { SvgIconProps } from "~/components/SvgIcon";

/**
 * HOC for creating `SvgIcon` component from path data
 * @param path Path components
 * @param displayName Display name of the component
 * @param componentProps `SvgIcon` props
 */
export const createSvgIcon = (
  path: React.ReactElement,
  displayName: string,
  componentProps?: SvgIconProps
) => {
  const Component = React.forwardRef<SVGSVGElement, SvgIconProps>(
    (props, ref) => (
      <SvgIcon
        {...{ ...props, ...componentProps }}
        data-testid={`${displayName}-icon`}
        ref={ref}
      >
        {path}
      </SvgIcon>
    )
  );

  if (process.env.NODE_ENV !== "production") {
    Component.displayName = `${displayName}-icon`;
  }

  return React.memo(Component);
};
