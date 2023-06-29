import clsx from "clsx";
import React from "react";

import Avatar from "~/components/Avatar";
import AvatarGroup from "~/components/AvatarGroup";
import Typography, { TypographyLevel } from "~/components/Typography";

import styles from "./Persona.module.scss";
import { PersonaProps, PersonaSize } from "./Persona.props";

const sizeToPrimaryTextLevelMap: Partial<Record<PersonaSize, TypographyLevel>> =
  {
    xs: "body3",
    sm: "body3",
    md: "body2",
    lg: "body1",
  } as const;

const sizeToSecondaryTextLevelMap: Partial<
  Record<PersonaSize, TypographyLevel>
> = {
  sm: "body3",
  md: "body3",
  lg: "body2",
} as const;

const Persona = React.forwardRef<HTMLDivElement, PersonaProps>((props, ref) => {
  const {
    avatar,
    size = "md",
    primaryText,
    secondaryText,
    className,
    componentProps,
    ...rest
  } = props;
  const firstAvatar = Array.isArray(avatar) ? avatar[0] : avatar;

  return (
    <div
      {...rest}
      className={clsx(styles.persona, styles[size], className)}
      ref={ref}
    >
      {Array.isArray(avatar) && avatar.length > 1 ? (
        <AvatarGroup
          {...componentProps?.avatarGroup}
          className={clsx(
            styles["avatar-item"],
            componentProps?.avatarGroup?.className
          )}
          size={size}
        >
          {avatar.map((avatarProps, index) => (
            <Avatar {...avatarProps} key={index} size={undefined} />
          ))}
        </AvatarGroup>
      ) : (
        <Avatar
          {...firstAvatar}
          className={clsx(styles["avatar-item"], firstAvatar.className)}
          size={size}
        />
      )}
      <Typography
        {...componentProps?.primaryText}
        as={"span"}
        className={clsx(
          styles["primary-text"],
          componentProps?.primaryText?.className
        )}
        level={sizeToPrimaryTextLevelMap[size]}
      >
        {primaryText}
        {secondaryText && size !== "xs" ? (
          <Typography
            {...componentProps?.secondaryText}
            className={clsx(
              "t-minor",
              styles["secondary-text"],
              componentProps?.secondaryText?.className
            )}
            level={sizeToSecondaryTextLevelMap[size]}
          >
            {secondaryText}
          </Typography>
        ) : null}
      </Typography>
    </div>
  );
});

Persona.displayName = "Persona";

export default Persona;
