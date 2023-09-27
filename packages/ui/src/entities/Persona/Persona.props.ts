import React from "react";

import { AvatarProps } from "~/components/Avatar";
import { AvatarGroupProps } from "~/components/AvatarGroup";
import { TypographyProps } from "~/components/Typography";

export type PersonaSize = "xs" | "sm" | "md" | "lg";

type AvatarPropsWithoutSize = Omit<AvatarProps, "size">;

export interface PersonaProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The props for the Avatar component. Pass an array of props to render an AvatarGroup component.
   */
  avatar: AvatarPropsWithoutSize | AvatarPropsWithoutSize[];
  /**
   * The props passed to the individual entity components.
   */
  component_props?: {
    avatarGroup?: AvatarGroupProps;
    primaryText?: TypographyProps;
    secondaryText?: TypographyProps;
  };
  /**
   * The primary text for the entity.
   */
  primaryText: React.ReactNode;
  /**
   * The secondary text for the entity.
   */
  secondaryText?: React.ReactNode;
  /**
   * The size of the entity.
   * @default 'md'
   */
  size?: PersonaSize;
}
