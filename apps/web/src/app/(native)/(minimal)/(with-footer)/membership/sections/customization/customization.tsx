import { clsx } from "clsx";
import React from "react";

import Logo from "~/brand/logo";
import AspectRatio from "~/components/aspect-ratio";
import Grow from "~/components/grow";
import Image from "~/components/image";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import page_styles from "../../styles.module.scss";
import styles from "./customization.module.scss";

const Preview = (): React.ReactElement => (
  <div
    aria-hidden={"true"}
    className={clsx(css["flex-col"], page_styles.preview, styles.preview)}
  >
    <AspectRatio className={styles.banner} ratio={40 / 9}>
      <Image
        alt={""}
        hex={"a9a9a9"}
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/w@960/web-assets/presentational/blog-banner`}
      />
    </AspectRatio>
    <div
      className={clsx("force-light-mode", css["flex-center"], styles.navbar)}
    >
      <Logo className={styles.logo} size={24} />
      <Grow />
      <div className={clsx(css["flex-center"], styles.actions)}>
        <span />
        <span />
        <span />
      </div>
    </div>
    <div className={clsx(css.flex, styles.body)}>
      <span className={styles.lsb} />
      <span className={styles.main} />
      <span className={styles.rsb} />
    </div>
  </div>
);

const CustomizationSection = (): React.ReactElement => (
  <section className={page_styles.section}>
    <div className={clsx(css.flex, page_styles["section-header"])}>
      <Typography
        className={clsx(page_styles.x, page_styles["section-title"])}
        level={"h2"}
      >
        Customize your blogs
      </Typography>
      <Typography level={"legible"}>
        Add personalised banners and newsletter splash images to your blogs that
        align with your brand.
      </Typography>
    </div>
    <Preview />
  </section>
);

export default CustomizationSection;
