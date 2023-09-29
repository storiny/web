"use client";

import { Root } from "@radix-ui/react-accessible-icon";
import clsx from "clsx";
import React from "react";

import Tooltip from "src/components/tooltip";

import styles from "../badges.module.scss";

const StaffBadge = React.forwardRef<
  SVGSVGElement,
  React.ComponentPropsWithoutRef<"svg">
>(({ className, ...rest }, ref) => (
  <Root label={"Staff"}>
    <Tooltip content={"Staff"}>
      <svg
        {...rest}
        className={clsx(styles.badge, className)}
        fill={"none"}
        ref={ref}
        viewBox="0 0 24 24"
      >
        <g clipPath="url(#s-a)">
          <path
            d="m11.88 9.45 6.7 14.15-2.44-.62a1.1 1.1 0 0 1-.6-.6l-4.97-12.21 1.3-.72Z"
            fill="#9C6700"
            stroke="#45413C"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth=".8"
          />
          <path
            d="M15.72 7.35 11.84 9.5l6.28 13.75c.16.34.58.46.89.26l2.1-1.33a2.39 2.39 0 0 0 .87-3.1L15.72 7.36h0Z"
            fill="url(#s-b)"
            stroke="#45413C"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth=".8"
          />
          <path
            d="M8.7 2.08 12.03.81a6.11 6.11 0 0 1 5.31.44c1.55.99 2.58 2.61 2.46 5.19a.95.95 0 0 1-.95.87l-2.7-.2-4.24 2.34c-1.07-.63-1.94-1.07-3.13-.6L6.13 5.02c0-.23.43-1.3 1.39-2.22.4-.43.87-.63 1.18-.7Z"
            fill="url(#s-c)"
          />
          <path
            d="m9.1 3.82 3.17-1.22a5.6 5.6 0 0 1 5.07.43 4.5 4.5 0 0 1 2.06 3.33c.04-.08.04-.36.04-.47.12-2.46-.63-3.77-2.1-4.72a5.85 5.85 0 0 0-5.07-.44L9.1 1.96a4.13 4.13 0 0 0-2.5 2.82l.64.4c.43-.8.99-1 1.86-1.36Z"
            fill="#DFF1FF"
          />
          <path
            d="M6.09 5.05A4.28 4.28 0 0 1 8.7 2.08L12.03.81a6.11 6.11 0 0 1 5.31.44c1.55.99 2.58 2.61 2.46 5.19a.95.95 0 0 1-.95.87l-2.3-.16c-.28 0-.55.04-.83.2l-3.84 2.1c-1.07-.63-2.38-1.03-3.53-.51L6.09 5.05Z"
            stroke="#45413C"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth=".8"
          />
          <path
            d="M8.74 8.86v1.27a2.24 2.24 0 0 1 1.83.04l1.3-.72c-1.06-.6-1.98-1.07-3.13-.6Z"
            fill="url(#s-d)"
            stroke="#45413C"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth=".8"
          />
          <path
            d="M8.19 7.15c-.91-1.82-2.58-2.85-3.73-2.3l-1.74.88c-1.1.55-1.27 2.5-.36 4.36.92 1.86 2.58 2.85 3.73 2.3l1.74-.88c1.11-.6 1.27-2.53.36-4.36Z"
            fill="url(#s-e)"
            stroke="#45413C"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth=".8"
          />
          <path
            d="M2.76 5.73c1.11-.56 2.77.43 3.73 2.3.95 1.86.75 3.76-.36 4.35-1.11.6-2.78-.43-3.73-2.3-.95-1.86-.79-3.76.36-4.35Z"
            fill="url(#s-f)"
            stroke="#45413C"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth=".8"
          />
        </g>
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="s-b"
            x1="14.93"
            x2="21.6"
            y1="12.98"
            y2="20.82"
          >
            <stop stopColor="#E99600" />
            <stop offset=".22" stopColor="#E29100" />
            <stop offset=".55" stopColor="#CE8400" />
            <stop offset=".94" stopColor="#AE6E00" />
            <stop offset="1" stopColor="#A86A00" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="s-c"
            x1="8.77"
            x2="19.54"
            y1="3.7"
            y2="6.86"
          >
            <stop stopColor="#80E8DD" />
            <stop offset=".25" stopColor="#7DC8F2" />
            <stop offset=".5" stopColor="#9E9AE9" />
            <stop offset=".75" stopColor="#CE8BCA" />
            <stop offset="1" stopColor="#E5A7B4" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="s-d"
            x1="8.73"
            x2="11.86"
            y1="9.41"
            y2="9.41"
          >
            <stop stopColor="#504E75" />
            <stop offset=".52" stopColor="#996796" />
            <stop offset="1" stopColor="#916A72" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="s-e"
            x1="4.42"
            x2="5.7"
            y1="7.05"
            y2="9.4"
          >
            <stop stopColor="#80E8DD" />
            <stop offset=".25" stopColor="#7DC8F2" />
            <stop offset=".5" stopColor="#9E9AE9" />
            <stop offset=".75" stopColor="#CE8BCA" />
            <stop offset="1" stopColor="#E5A7B4" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="s-f"
            x1="3.41"
            x2="6.13"
            y1="10.76"
            y2="6.23"
          >
            <stop stopColor="#8FFFF3" />
            <stop offset=".44" stopColor="#7EC6F2" />
            <stop offset=".67" stopColor="#7DC8F2" />
            <stop offset="1" stopColor="#9E9AE9" />
          </linearGradient>
          <clipPath id="s-a">
            <path d="M0 0h24v24H0z" fill="#fff" />
          </clipPath>
        </defs>
      </svg>
    </Tooltip>
  </Root>
));

StaffBadge.displayName = "StaffBadge";

export default StaffBadge;
