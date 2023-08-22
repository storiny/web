"use client";

import { useNProgress } from "@tanem/react-nprogress";
import { clsx } from "clsx";
import React from "react";

import ProgressBar from "~/components/ProgressBar";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

import styles from "./loader.module.scss";

const Logo = (): React.ReactElement => (
  <svg
    fill="none"
    viewBox="0 0 76 71"
    width={76}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 0h7.54v19.98H0z"
      fill="url(#a)"
      transform="matrix(.9 -.5 .5 .9 41.63 28.75)"
    />
    <path
      d="M0 0h7.54v19.98H0z"
      fill="url(#b)"
      transform="matrix(.9 -.5 .5 .9 41.63 28.75)"
    />
    <ellipse cx="38.03" cy="14.96" fill="url(#c)" rx="14.25" ry="14.24" />
    <ellipse cx="61.75" cy="56.04" fill="url(#d)" rx="14.25" ry="14.24" />
    <ellipse cx="14.25" cy="56.04" fill="url(#e)" rx="14.25" ry="14.24" />
    <defs>
      <radialGradient
        cx="0"
        cy="0"
        gradientTransform="matrix(3.5 18.5 -18.5 3.5 34.48 10.74)"
        gradientUnits="userSpaceOnUse"
        id="c"
        r="1"
      >
        <stop stopColor="#51565C" />
        <stop offset="1" />
      </radialGradient>
      <radialGradient
        cx="0"
        cy="0"
        gradientTransform="matrix(3.5 18.5 -18.5 3.5 58.2 51.83)"
        gradientUnits="userSpaceOnUse"
        id="d"
        r="1"
      >
        <stop stopColor="#51565C" />
        <stop offset="1" />
      </radialGradient>
      <radialGradient
        cx="0"
        cy="0"
        gradientTransform="matrix(3.5 18.5 -18.5 3.5 10.7 51.83)"
        gradientUnits="userSpaceOnUse"
        id="e"
        r="1"
      >
        <stop stopColor="#51565C" />
        <stop offset="1" />
      </radialGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="a"
        x1="15.79"
        x2="-8.96"
        y1="9.23"
        y2="9.88"
      >
        <stop />
        <stop offset=".5" stopColor="#4D5156" />
        <stop offset="1" />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="b"
        x1="3.77"
        x2="3.77"
        y1="0"
        y2="19.98"
      >
        <stop stopColor="#1D1E20" stopOpacity=".64" />
        <stop offset=".13" stopOpacity="0" />
        <stop offset=".88" stopOpacity="0" />
        <stop offset="1" stopColor="#1D1E20" stopOpacity=".42" />
      </linearGradient>
    </defs>
  </svg>
);

const EditorLoader = (): React.ReactElement => {
  const [loading, setLoading] = React.useState<boolean>(true);
  const { progress, isFinished, animationDuration } = useNProgress({
    isAnimating: loading
  });

  React.useEffect(() => {
    setLoading(true);
    return () => setLoading(false);
  }, []);

  return (
    <div
      aria-label={"Loading…"}
      className={clsx("flex-col", "flex-center", styles.x, styles.loader)}
    >
      <Logo />
      <div className={clsx("flex-col", "flex-center")}>
        <Typography className={"t-minor"} level={"body2"}>
          Loading document…
        </Typography>
        <Spacer orientation={"vertical"} size={1.5} />
        <ProgressBar
          className={clsx(styles.x, styles.progress)}
          max={100}
          slotProps={{
            indicator: {
              style: {
                transition: `transform ${animationDuration}ms ease-out`
              }
            }
          }}
          value={isFinished && !loading ? 100 : progress * 100}
        />
      </div>
    </div>
  );
};

export default EditorLoader;
