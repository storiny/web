import React from "react";

import { AvatarProps } from "~/components/avatar";
import { AvatarGroupProps } from "~/components/avatar-group";
import { TypographyProps } from "~/components/typography";

export type PersonaSize = "xs" | "sm" | "md" | "lg";

type AvatarPropsWithoutSize = Omit<AvatarProps, "size">;

export interface PersonaProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The props for the Avatar component. Pass an array of props to render an
   * AvatarGroup component.
   */
  avatar: AvatarPropsWithoutSize | AvatarPropsWithoutSize[];
  /**
   * The props passed to the individual entity components.
   */
  component_props?: {
    avatar_group?: AvatarGroupProps;
    primary_text?: TypographyProps;
    secondary_text?: TypographyProps;
  };
  /**
   * The primary text for the entity.
   */
  primary_text: React.ReactNode;
  /**
   * The secondary text for the entity.
   */
  secondary_text?: React.ReactNode;
  /**
   * The size of the entity.
   * @default 'md'
   */
  size?: PersonaSize;
}
