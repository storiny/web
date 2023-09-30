"use client";

import React from "react";

import SvgIcon, { SvgIconProps } from "~/components/svg-icon";

/**
 * HOC for creating `SvgIcon` component from path data
 * @param path Path components
 * @param display_name Display name of the component
 * @param component_props `SvgIcon` props
 */
export const create_svg_icon = (
  path: React.ReactElement,
  display_name: string,
  component_props?: SvgIconProps
): React.MemoExoticComponent<typeof SvgIcon> => {
  const Component = React.forwardRef<SVGSVGElement, SvgIconProps>(
    (props, ref) => (
      <SvgIcon {...Object.assign({}, props, component_props)} ref={ref}>
        {path}
      </SvgIcon>
    )
  );

  if (process.env.NODE_ENV !== "production") {
    Component.displayName = `${display_name}-icon`;
  }

  return React.memo(Component);
};
