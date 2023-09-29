"use client";

import clsx from "clsx";
import React from "react";

import Grow from "src/components/grow";
import ChevronIcon from "src/icons/chevron";
import { forward_ref } from "src/utils/forward-ref";

import common_styles from "../common/button-reset.module.scss";
import styles from "./navigation-item.module.scss";
import { NavigationItemProps } from "./navigation-item.props";

const NavigationItem = forward_ref<NavigationItemProps, "button">(
  (props, ref) => {
    const {
      as: Component = "button",
      decorator,
      end_decorator,
      disabled,
      slot_props,
      className,
      children,
      ...rest
    } = props;
    return (
      <Component
        {...rest}
        className={clsx(
          common_styles.reset,
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
            {...slot_props?.decorator}
            className={clsx(
              "flex-center",
              styles.decorator,
              slot_props?.decorator?.className
            )}
          >
            {decorator}
          </span>
        )}
        {children}
        <Grow />
        <span
          {...slot_props?.end_decorator}
          className={clsx(
            "flex-center",
            styles.chevron,
            slot_props?.end_decorator?.className
          )}
        >
          {end_decorator || <ChevronIcon rotation={90} />}
        </span>
      </Component>
    );
  }
);

NavigationItem.displayName = "NavigationItem";

export default NavigationItem;
