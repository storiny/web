import clsx from "clsx";
import React from "react";

import Avatar from "~/components/avatar";
import AvatarGroup from "~/components/avatar-group";
import Typography, { TypographyLevel } from "~/components/typography";
import css from "~/theme/main.module.scss";

import styles from "./persona.module.scss";
import { PersonaProps, PersonaSize } from "./persona.props";

const SIZE_PRIMARY_TEXT_LEVEL_MAP: Partial<
  Record<PersonaSize, TypographyLevel>
> = {
  xs: "body3",
  sm: "body3",
  md: "body2",
  lg: "body1"
} as const;
const SIZE_SECONDARY_TEXT_LEVEL_MAP: Partial<
  Record<PersonaSize, TypographyLevel>
> = {
  sm: "body3",
  md: "body3",
  lg: "body2"
} as const;

const Persona = React.forwardRef<HTMLDivElement, PersonaProps>((props, ref) => {
  const {
    avatar,
    size = "md",
    primary_text,
    secondary_text,
    className,
    component_props,
    render_avatar = (avatar): React.ReactNode => avatar,
    ...rest
  } = props;
  const first_avatar = Array.isArray(avatar) ? avatar[0] : avatar;
  return (
    <div
      {...rest}
      className={clsx(styles.persona, styles[size], className)}
      ref={ref}
    >
      {Array.isArray(avatar) && avatar.length > 1 ? (
        <AvatarGroup
          {...component_props?.avatar_group}
          className={clsx(
            styles["avatar-item"],
            component_props?.avatar_group?.className
          )}
          size={size}
        >
          {avatar.map((avatar_props, index) =>
            render_avatar(
              <Avatar {...avatar_props} key={index} size={undefined} />,
              index
            )
          )}
        </AvatarGroup>
      ) : (
        render_avatar(
          <Avatar
            {...first_avatar}
            className={clsx(styles["avatar-item"], first_avatar.className)}
            size={size}
          />,
          0
        )
      )}
      <Typography
        {...component_props?.primary_text}
        as={"span"}
        className={clsx(
          styles["primary-text"],
          component_props?.primary_text?.className
        )}
        level={SIZE_PRIMARY_TEXT_LEVEL_MAP[size]}
      >
        {primary_text}
        {secondary_text && size !== "xs" ? (
          <Typography
            {...component_props?.secondary_text}
            className={clsx(
              styles["secondary-text"],
              component_props?.secondary_text?.className
            )}
            color={"minor"}
            level={SIZE_SECONDARY_TEXT_LEVEL_MAP[size]}
          >
            {secondary_text}
          </Typography>
        ) : null}
      </Typography>
    </div>
  );
});

Persona.displayName = "Persona";

export default Persona;
