"use client";

import { Root } from "@radix-ui/react-accessible-icon";
import clsx from "clsx";
import React from "react";

import Tooltip from "~/components/tooltip";

import styles from "../badges.module.scss";

const EarlyUserBadge = React.forwardRef<
  SVGSVGElement,
  React.ComponentPropsWithoutRef<"svg">
>(({ className, ...rest }, ref) => (
  <Root label={"Early user"}>
    <Tooltip content={"Early user"}>
      <svg
        {...rest}
        className={clsx(styles.badge, className)}
        fill={"none"}
        ref={ref}
        viewBox="0 0 24 24"
      >
        <g clipPath="url(#eu-a)">
          <g clipPath="url(#eu-b)">
            <path
              d="M23.59 14.77a1.8 1.8 0 0 1-1.93 1.48 1.33 1.33 0 0 1-.48-.17l-.07.65c-1.1 8.52-17.63 8.47-18.73 0l-.05-.47a1.8 1.8 0 0 1-1.92-1.48c-.11-.9.27-1.8 1.01-2.35.33-.25.67-.5 1.01-.72l.02-.02C4.4.53 18.85.36 21 11.37c.55.3 1.08.66 1.58 1.05a2.53 2.53 0 0 1 1 2.35Z"
              fill="url(#eu-c)"
              stroke="#45413C"
              strokeMiterlimit="10"
              strokeWidth=".79"
            />
            <path
              d="M4.04 11.1a.47.47 0 1 0 0-.94.47.47 0 0 0 0 .94Zm6.97 1.1a.47.47 0 1 0 0-.95.47.47 0 0 0 0 .94Z"
              fill="#45413C"
            />
            <path
              d="M20.74 7.5a.47.47 0 0 1-.65.16l-1.67-.96a.47.47 0 0 0-.48 0l-2.7 1.57a.5.5 0 0 1-.48 0l-2.78-1.6a.5.5 0 0 0-.48 0l-2.78 1.6a.47.47 0 0 1-.47 0L5.53 6.7a.49.49 0 0 0-.47 0l-1.67.96a.45.45 0 0 1-.36.05.47.47 0 0 1-.34-.58c.55-2 2.71-6.15 9.05-6.15 6.34 0 8.5 4.15 9.04 6.15.04.12.02.26-.04.36Z"
              fill="url(#eu-d)"
            />
            <path
              d="M20.93 7.56a.48.48 0 0 1-.66.17l-.57-.44-1.14-.62a.47.47 0 0 0-.48 0l-2.77 1.6a.49.49 0 0 1-.49 0l-2.84-1.64a.49.49 0 0 0-.48 0L8.65 8.26a.49.49 0 0 1-.48 0L5.4 6.66a.48.48 0 0 0-.48 0l-1.05.73-.66.34a.49.49 0 0 1-.37.05.49.49 0 0 1-.34-.6C3.06 5.14 5.27.91 11.74.9c6.47 0 8.68 4.24 9.24 6.28.04.13.02.26-.05.38Z"
              stroke="#45413C"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth=".78"
            />
            <path
              d="M9.33 12.9a.48.48 0 0 1-.04.2l-.01.03a.4.4 0 0 1-.06.08.42.42 0 0 1-.07.08l-.08.05-.24.14-2.2 1.28a1.41 1.41 0 0 1-2.1-1.02l-.1-.7a1.34 1.34 0 0 1 .8-1.43 3.44 3.44 0 0 1 3.71.69l.14.14.13.14.02.04.07.12a.58.58 0 0 1 .03.17Z"
              fill="url(#eu-e)"
            />
            <path
              d="m22.72 12.55-.01.16a1.8 1.8 0 0 1-1.91 1.49.6.6 0 0 0-.68.51v.05c-.11 2.05-2.04 2.12-3.17 1.53a.61.61 0 0 0-.89.37c-.21.82-.94 1.4-1.8 1.44-.59.07-1.2-.02-1.74-.28a1.67 1.67 0 0 1-.4-.3c.05.32.14.65.26.96.15.58.52 1.08 1.02 1.4.55.26 1.15.36 1.75.28.9-.03 1.66-.68 1.83-1.56.07-.37.09-.74.05-1.11.25 1.35 4.54 2.34 3.9-1.59.21.2.47.32.74.36a1.8 1.8 0 0 0 1.92-1.48 2.5 2.5 0 0 0-.87-2.23Z"
              fill="url(#eu-f)"
            />
            <path
              d="M12.08 14.7a8.49 8.49 0 0 0 .3 3.78c.15.58.52 1.08 1.02 1.4.55.26 1.15.36 1.75.28.9-.03 1.66-.68 1.83-1.56.08-.41.09-.84.04-1.25-.03 1.42 4.57 2.6 3.92-1.45.2.2.46.32.73.36a1.8 1.8 0 0 0 1.92-1.48 2.55 2.55 0 0 0-1.01-2.36"
              stroke="#45413C"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth=".77"
            />
            <path
              d="M5.23 11.62c-.56.23-.9.82-.8 1.43l.1.7a1.4 1.4 0 0 0 2.1 1.01l2.44-1.42a.5.5 0 0 0 .14-.76 3.45 3.45 0 0 0-3.99-.96h0Z"
              stroke="#45413C"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth=".39"
            />
          </g>
        </g>
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="eu-d"
            x1="8.36"
            x2="14.23"
            y1="1.17"
            y2="11.33"
          >
            <stop stopColor="#fff" />
            <stop offset="1" stopColor="#FFD394" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="eu-e"
            x1="6.11"
            x2="8.12"
            y1="14.49"
            y2="10"
          >
            <stop stopColor="#FF8415" />
            <stop offset=".26" stopColor="#E87F0A" />
            <stop offset=".53" stopColor="#D97C02" />
            <stop offset=".74" stopColor="#D47C00" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="eu-f"
            x1="16.25"
            x2="21.63"
            y1="12.93"
            y2="23.08"
          >
            <stop stopColor="#D49400" />
            <stop offset=".12" stopColor="#C08500" />
            <stop offset=".23" stopColor="#AA7600" />
          </linearGradient>
          <clipPath id="eu-a">
            <path d="M0 0h24v24H0z" fill="#fff" />
          </clipPath>
          <clipPath id="eu-b">
            <path d="M-1 0h25v24H-1z" fill="#fff" />
          </clipPath>
          <radialGradient
            cx="0"
            cy="0"
            gradientTransform="matrix(11 0 0 11 13.47 20.26)"
            gradientUnits="userSpaceOnUse"
            id="eu-c"
            r="1"
          >
            <stop stopColor="#E99C00" />
            <stop offset="1" stopColor="#FFC515" />
          </radialGradient>
        </defs>
      </svg>
    </Tooltip>
  </Root>
));

EarlyUserBadge.displayName = "EarlyUserBadge";

export default EarlyUserBadge;
