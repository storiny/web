"use client";

import clsx from "clsx";
import React from "react";

import Grow from "~/components/Grow";
import ChevronIcon from "~/icons/Chevron";
import { forwardRef } from "~/utils/forwardRef";

import commonStyles from "../common/ButtonReset.module.scss";
import styles from "./NavigationItem.module.scss";
import { NavigationItemProps } from "./NavigationItem.props";

const NavigationItem = forwardRef<NavigationItemProps, "button">(
  (props, ref) => {
    const {
      as: Component = "button",
      decorator,
      disabled,
      slotProps,
      className,
      children,
      ...rest
    } = props;

    return (
      <Component
        {...rest}
        className={clsx(
          commonStyles.reset,
          "flex-center",
          "focusable",
          "f-grow",
          styles["navigation-item"],
          className
        )}
        data-disabled={String(Boolean(disabled))}
        disabled={disabled}
        ref={ref}
      >
        {decorator && (
          <span
            {...slotProps?.decorator}
            className={clsx(
              "flex-center",
              styles.decorator,
              slotProps?.decorator?.className
            )}
          >
            {decorator}
          </span>
        )}
        {children}
        <Grow />
        <span className={clsx("flex-center", styles.chevron)}>
          <ChevronIcon rotation={90} />
        </span>
      </Component>
    );
  }
);

NavigationItem.displayName = "NavigationItem";

export default NavigationItem;
