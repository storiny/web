"use client";

import { Root } from "@radix-ui/react-accessible-icon";
import clsx from "clsx";
import React from "react";

import Tooltip from "~/components/tooltip";

import styles from "../badges.module.scss";

const PlusBadge = React.forwardRef<
  SVGSVGElement,
  React.ComponentPropsWithoutRef<"svg">
>(({ className, ...rest }, ref) => (
  <Root label={"Storiny+ member"}>
    <Tooltip content={"Storiny+ member"}>
      <svg
        {...rest}
        className={clsx(styles.badge, className)}
        fill={"none"}
        ref={ref}
        viewBox="0 0 24 24"
      >
        <path
          clipRule="evenodd"
          d="M12 .5c.7 0 1.28.57 1.28 1.28a8.94 8.94 0 0 0 8.94 8.94 1.28 1.28 0 0 1 0 2.56 8.94 8.94 0 0 0-8.94 8.94 1.28 1.28 0 0 1-2.56 0 8.94 8.94 0 0 0-8.94-8.94 1.28 1.28 0 0 1 0-2.56 8.94 8.94 0 0 0 8.94-8.94c0-.7.57-1.28 1.28-1.28Z"
          fill="url(#pl-a)"
          fillRule="evenodd"
        />
        <path
          clipRule="evenodd"
          d="M12 .5c.7 0 1.28.57 1.28 1.28a8.94 8.94 0 0 0 8.94 8.94 1.28 1.28 0 0 1 0 2.56 8.94 8.94 0 0 0-8.94 8.94 1.28 1.28 0 0 1-2.56 0 8.94 8.94 0 0 0-8.94-8.94 1.28 1.28 0 0 1 0-2.56 8.94 8.94 0 0 0 8.94-8.94c0-.7.57-1.28 1.28-1.28Z"
          fill="url(#pl-b)"
          fillRule="evenodd"
        />
        <path
          clipRule="evenodd"
          d="M12 .5c.7 0 1.28.57 1.28 1.28a8.94 8.94 0 0 0 8.94 8.94 1.28 1.28 0 0 1 0 2.56 8.94 8.94 0 0 0-8.94 8.94 1.28 1.28 0 0 1-2.56 0 8.94 8.94 0 0 0-8.94-8.94 1.28 1.28 0 0 1 0-2.56 8.94 8.94 0 0 0 8.94-8.94c0-.7.57-1.28 1.28-1.28Z"
          stroke="#45413C"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth=".8"
        />
        <defs>
          <radialGradient
            cx="0"
            cy="0"
            gradientTransform="matrix(0 12 -11 0 12 12)"
            gradientUnits="userSpaceOnUse"
            id="pl-a"
            r="1"
          >
            <stop stopColor="#F679F1" />
            <stop offset="1" stopColor="#168FFF" />
          </radialGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="pl-b"
            x1="-2.91"
            x2="26.91"
            y1="-5.89"
            y2="29.89"
          >
            <stop stopOpacity="0" />
            <stop offset=".27" stopColor="#fff" stopOpacity=".5" />
            <stop offset=".69" stopOpacity=".26" />
            <stop offset="1" stopColor="#fefefe" stopOpacity="0" />
            <stop offset="1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </Tooltip>
  </Root>
));

PlusBadge.displayName = "PlusBadge";

export default PlusBadge;
