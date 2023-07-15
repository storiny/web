import "./FilledButton.scss";

import clsx from "clsx";
import React, { forwardRef } from "react";

export type ButtonVariant = "filled" | "outlined" | "icon";
export type ButtonColor = "primary" | "danger" | "warning" | "muted";
export type ButtonSize = "medium" | "large";

export type FilledButtonProps = {
  children?: React.ReactNode;

  className?: string;
  color?: ButtonColor;

  fullWidth?: boolean;
  label: string;
  onClick?: () => void;
  size?: ButtonSize;
  startIcon?: React.ReactNode;

  variant?: ButtonVariant;
};

export const FilledButton = forwardRef<HTMLButtonLayer, FilledButtonProps>(
  (
    {
      children,
      startIcon,
      onClick,
      label,
      variant = "filled",
      color = "primary",
      size = "medium",
      fullWidth,
      className
    },
    ref
  ) => (
    <button
      aria-label={label}
      className={clsx(
        "ExcButton",
        `ExcButton--color-${color}`,
        `ExcButton--variant-${variant}`,
        `ExcButton--size-${size}`,
        { "ExcButton--fullWidth": fullWidth },
        className
      )}
      onClick={onClick}
      ref={ref}
      type="button"
    >
      {startIcon && (
        <div aria-hidden className="ExcButton__icon">
          {startIcon}
        </div>
      )}
      {variant !== "icon" && (children ?? label)}
    </button>
  )
);
