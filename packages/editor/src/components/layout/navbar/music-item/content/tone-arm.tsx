import { clsx } from "clsx";
import React from "react";

import styles from "./content.module.scss";

const ToneArm = ({ playing }: { playing: boolean }): React.ReactElement => (
  <svg
    className={clsx(styles["tone-arm"], playing && styles.playing)}
    data-force-animation={""}
    fill="none"
    height="87"
    role={"presentation"}
    width="35"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#tone-arm-filter)">
      <path
        d="M26 15v46.42a8 8 0 0 1-3.3 6.48l-10.01 7.26"
        stroke="#6E7987"
        strokeWidth="5"
      />
    </g>
    <g filter="url(#tone-head-filter)">
      <rect
        fill="#6E7987"
        height="14"
        rx="2"
        transform="rotate(55.5 11.92 69.69)"
        width="10"
        x="11.92"
        y="69.69"
      />
    </g>
    <foreignObject height="16" width="16" x="18" y="0">
      <div className={styles.base} data-force-animation={""} />
    </foreignObject>
    <defs>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height="62.19"
        id="tone-arm-filter"
        width="17.28"
        x="11.22"
        y="15"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset />
        <feGaussianBlur stdDeviation="1.5" />
        <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
        <feBlend in2="shape" result="arm-inset-shadow" />
      </filter>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height="17.11"
        id="tone-head-filter"
        width="18.64"
        x=".16"
        y="68.97"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset dx="1" dy="-.5" />
        <feGaussianBlur stdDeviation=".5" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
        <feBlend in2="BackgroundImageFix" result="head-drop-shadow" />
        <feBlend in="SourceGraphic" in2="head-drop-shadow" result="shape" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset dx="1" dy="1" />
        <feGaussianBlur stdDeviation=".5" />
        <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
        <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.3 0" />
        <feBlend in2="shape" result="head-inner-shadow" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset dx="-1" dy="-1" />
        <feGaussianBlur stdDeviation=".5" />
        <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.35 0" />
        <feBlend in2="head-inner-shadow" result="head-inset-shadow" />
      </filter>
    </defs>
  </svg>
);

export default ToneArm;
