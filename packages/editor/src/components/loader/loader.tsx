"use client";

import { clsx } from "clsx";
import React from "react";

import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import styles from "./loader.module.scss";

const EditorLoader = ({
  label = "Loading document…",
  overlay,
  hide_progress,
  icon,
  action
}: {
  action?: React.ReactNode;
  hide_progress?: boolean;
  icon?: React.ReactNode;
  label?: React.ReactNode;
  overlay?: boolean;
}): React.ReactElement => (
  <div
    aria-label={typeof label === "string" ? label : "Loading…"}
    className={clsx(
      css["flex-col"],
      css["flex-center"],
      styles.loader,
      overlay && styles.overlay
    )}
    data-testid={"overlay"}
  >
    {!hide_progress ? (
      <video
        autoPlay={true}
        className={styles.video}
        controls={false}
        disablePictureInPicture={true}
        disableRemotePlayback={true}
        height={96}
        loop={true}
        muted={true}
        playsInline={true}
        width={96}
      >
        <source
          src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/animations/loading/render.mov`}
          type="video/quicktime"
        />
        <source
          src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/animations/loading/render.webm`}
          type="video/webm"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className={styles["video-fallback"]}
          src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/animations/loading/thumb`}
        />
      </video>
    ) : (
      <React.Fragment>
        {icon}
        <Spacer orientation={"vertical"} size={2} />
      </React.Fragment>
    )}
    <Typography
      className={clsx(css["t-minor"], styles.x, styles.label)}
      level={"body2"}
    >
      {label}
    </Typography>
    {Boolean(action) && (
      <React.Fragment>
        <Spacer orientation={"vertical"} size={2} />
        {action}
      </React.Fragment>
    )}
  </div>
);

export default EditorLoader;
