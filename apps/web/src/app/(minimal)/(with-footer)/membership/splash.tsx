"use client";

import { ImageSize } from "@storiny/shared";
import React from "react";

import { select_theme } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "./styles.module.scss";

const MembershipSplash = (): React.ReactElement => {
  const theme = use_app_selector(select_theme);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={""}
        className={styles["splash-image"]}
        sizes={[`${BREAKPOINTS.up("desktop")} 960px`, "100vw"].join(",")}
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/presentational/membership-splash/${theme}`}
        srcSet={[
          `${process.env.NEXT_PUBLIC_CDN_URL}/w@${ImageSize.W_1200}/web-assets/presentational/membership-splash/${theme} 640w`,
          `${process.env.NEXT_PUBLIC_CDN_URL}/w@${ImageSize.W_1920}/web-assets/presentational/membership-splash/${theme} 960w`
        ].join(",")}
      />
    </>
  );
};

export default MembershipSplash;
