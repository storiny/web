import { clsx } from "clsx";
import React from "react";

import Logo from "~/brand/logo";
import Grow from "~/components/grow";
import Skeleton from "~/components/skeleton";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import page_styles from "../../styles.module.scss";
import styles from "./custom-domain.module.scss";

const Preview = (): React.ReactElement => (
  <div
    aria-hidden={"true"}
    className={clsx(css["flex-col"], page_styles.preview, styles.preview)}
  >
    <div className={clsx(css["flex-center"], styles.navbar)}>
      <Logo className={styles.logo} size={24} />
      <Grow />
      <div className={clsx(css["flex-center"], styles.actions)}>
        <span />
        <span />
        <span />
      </div>
    </div>
    <div className={clsx(css["f-grow"], css.flex)}>
      <div className={clsx(css["flex-col"], styles.lsb)}>
        <Skeleton height={18} width={96} />
        <Skeleton height={18} width={74} />
        <Skeleton height={18} width={105} />
      </div>
      <div className={css["f-grow"]} />
      <div className={clsx(css["flex-col"], styles.rsb)}>
        <Typography className={clsx(styles.x, styles.name)}>My blog</Typography>
        <div
          className={css["flex-col"]}
          style={{ gap: "8px", paddingBlock: "8px" }}
        >
          <Skeleton height={14} width={87} />
          <Skeleton height={14} width={74} />
          <Skeleton height={14} width={96} />
        </div>
      </div>
    </div>
  </div>
);

const CustomDomainSection = (): React.ReactElement => (
  <section className={page_styles.section}>
    <div className={clsx(css.flex, page_styles["section-header"])}>
      <Typography
        className={clsx(page_styles.x, page_styles["section-title"])}
        level={"h2"}
      >
        Blog on your domain
      </Typography>
      <Typography level={"legible"}>
        Add your own domain to your personal blog. Banner, right sidebar items,
        custom fonts, newsletter splash, and other premium features are not
        available on the basic plan.
      </Typography>
    </div>
    <Preview />
  </section>
);

export default CustomDomainSection;
