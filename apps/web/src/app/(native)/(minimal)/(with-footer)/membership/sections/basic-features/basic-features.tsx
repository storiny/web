import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import Feature from "../common/feature";
import styles from "./basic-features.module.scss";

const BasicFeatures = (): React.ReactElement => (
  <section className={clsx(styles.section, css.flex)}>
    <div className={styles["video-wrapper"]}>
      <video
        autoPlay={true}
        className={styles.video}
        controls={false}
        disablePictureInPicture={true}
        disableRemotePlayback={true}
        height={300}
        loop={true}
        muted={true}
        playsInline={true}
        poster={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/animations/pricing/basic/thumb`}
        width={300}
      >
        <source
          src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/animations/pricing/basic/render.mov`}
          type="video/quicktime"
        />
        <source
          src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/animations/pricing/basic/render.webm`}
          type="video/webm"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className={styles["video-fallback"]}
          src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/animations/pricing/basic/thumb`}
        />
      </video>
    </div>
    <div
      className={clsx(
        "force-light-mode",
        css["flex-col"],
        css["flex-center"],
        styles.container
      )}
    >
      <Typography color={"minor"} scale={"lg"}>
        Basic
      </Typography>
      <Typography className={css["flex-col"]} scale={"xl2"}>
        <span>$0</span>
        <Typography as={"span"} className={css["t-medium"]} color={"minor"}>
          per month
        </Typography>
      </Typography>
      <Spacer orientation={"vertical"} />
      <Divider style={{ backgroundColor: "var(--inverted-300)" }} />
      <Spacer orientation={"vertical"} />
      <div className={clsx(css["flex-col"], styles.features)}>
        <Feature
          value={
            <>
              Upto <span className={css["t-bold"]}>3 contributors</span> / story
            </>
          }
        />
        <Feature
          value={
            <>
              <span className={css["t-bold"]}>1 blog</span> with custom domain
            </>
          }
        />
        <Feature
          value={
            <>
              Upto <span className={css["t-bold"]}>5 editors</span> for your
              blog
            </>
          }
        />
        <Feature
          value={
            <>
              Upto <span className={css["t-bold"]}>10 writers</span> for your
              blog
            </>
          }
        />
        <Feature
          value={
            <>
              <span className={css["t-bold"]}>10MB</span> image uploads
            </>
          }
        />
        <Feature
          value={
            <>
              <span className={css["t-bold"]}>14 day</span> version history
            </>
          }
        />
      </div>
    </div>
  </section>
);

export default BasicFeatures;
