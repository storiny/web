import { clsx } from "clsx";
import React from "react";

import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import page_styles from "../../styles.module.scss";
import styles from "./custom-branding.module.scss";

const Preview = (): React.ReactElement => (
  <div
    aria-hidden={"true"}
    className={clsx(css.flex, page_styles.preview, styles.preview)}
  >
    <span className={styles.lsb} />
    <div className={clsx(css["flex-col"], styles.body)}>
      <Typography
        className={clsx(styles.x, styles.heading)}
        color={"major"}
        scale={"xl"}
      >
        🌿 Yucca
      </Typography>
      <Typography
        className={clsx(styles.x, styles["body-text"])}
        level={"legible"}
      >
        Yucca plants are the desert’s tough survivors, standing tall in the
        middle of barren landscapes with their sword-like leaves and flower
        spikes. Their starchy roots have been a source of food and medicine for
        centuries among indigenous groups.
      </Typography>
    </div>
    <span className={styles.rsb} />
  </div>
);

const CustomBrandingSection = (): React.ReactElement => (
  <section className={page_styles.section}>
    <div className={clsx(css.flex, page_styles["section-header"])}>
      <Typography
        className={clsx(page_styles.x, page_styles["section-title"])}
        level={"h2"}
      >
        Custom branding
      </Typography>
      <Typography level={"legible"}>
        Personalize all your blogs with your own fonts, tailor the design to
        seamlessly align with your brand, and remove the Storiny branding.
      </Typography>
    </div>
    <Preview />
  </section>
);

export default CustomBrandingSection;
