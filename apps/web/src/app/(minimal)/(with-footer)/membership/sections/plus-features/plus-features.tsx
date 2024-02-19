import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { PlusBadge } from "~/entities/badges";
import css from "~/theme/main.module.scss";

import Feature from "../common/feature";
import styles from "./plus-features.module.scss";

const PlusFeatures = (): React.ReactElement => (
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
        poster={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/animations/pricing/plus/thumb`}
        width={300}
      >
        <source
          src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/animations/pricing/plus/render.mov`}
          type="video/quicktime"
        />
        <source
          src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/animations/pricing/plus/render.webm`}
          type="video/webm"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className={styles["video-fallback"]}
          src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/animations/pricing/plus/thumb`}
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
        Plus
      </Typography>
      <Typography className={css["flex-col"]} scale={"xl2"}>
        <span>$-</span>
        <Typography as={"span"} className={css["t-medium"]} color={"minor"}>
          per month
        </Typography>
      </Typography>
      <Spacer orientation={"vertical"} />
      <Divider style={{ backgroundColor: "var(--inverted-300)" }} />
      <Spacer orientation={"vertical"} />
      <div className={clsx(css.flex, styles.features)}>
        <div className={css["flex-col"]}>
          <Feature
            value={
              <>
                Upto <span className={css["t-bold"]}>15 contributors</span> /
                story
              </>
            }
          />
          <Feature
            value={
              <>
                <span className={css["t-bold"]}>∞</span> blogs at{" "}
                <span className={css["t-bold"]}>$-</span> / blog / month
              </>
            }
          />
          <Feature
            value={
              <>
                <span className={css["t-bold"]}>∞</span> editors / blog
              </>
            }
          />
          <Feature
            value={
              <>
                <span className={css["t-bold"]}>∞</span> writers / blog
              </>
            }
          />
          <Feature
            value={
              <>
                <span className={css["t-bold"]}>∞</span> version history
              </>
            }
          />
          <Feature
            value={
              <>
                <span className={css["t-bold"]}>25MB</span> image uploads
              </>
            }
          />
        </div>
        <div className={css["flex-col"]}>
          <Feature
            value={
              <>
                <span className={css["t-bold"]}>5</span> custom sidebar items
              </>
            }
          />
          <Feature value={"Remove Storiny branding"} />
          <Feature value={"Custom fonts and design"} />
          <Feature value={"Blog banner"} />
          <Feature value={"Newsletter splash"} />
          <Feature value={"Membership badge"} />
        </div>
      </div>
      <Spacer orientation={"vertical"} />
      <Divider style={{ backgroundColor: "var(--inverted-300)" }} />
      <Spacer orientation={"vertical"} />
      <Button
        decorator={<PlusBadge no_stroke />}
        size={"lg"}
        style={{ pointerEvents: "none" }}
      >
        Available soon
      </Button>
    </div>
  </section>
);

export default PlusFeatures;
