import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Divider from "~/components/divider";
import IconButton from "~/components/icon-button";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import MailPlusIcon from "~/icons/mail-plus";
import PlusIcon from "~/icons/plus";
import css from "~/theme/main.module.scss";

import page_styles from "../../styles.module.scss";
import styles from "./right-sidebar-items.module.scss";

const Preview = (): React.ReactElement => (
  <div
    aria-hidden={"true"}
    className={clsx(css.flex, page_styles.preview, styles.preview)}
  >
    <span className={styles.lsb} />
    <span className={styles.body} />
    <div className={clsx(css["flex-col"], styles.rsb)}>
      <div style={{ opacity: "15%", pointerEvents: "none" }}>
        <Typography scale={"lg"}>My blog</Typography>
        <Spacer orientation={"vertical"} size={3.5} />
        <div className={css.flex}>
          <Button decorator={<PlusIcon />}>Follow</Button>
          <Spacer />
          <IconButton>
            <MailPlusIcon />
          </IconButton>
        </div>
      </div>
      <div className={styles.divider}>
        <Divider />
      </div>
      <Typography className={css["t-medium"]} color={"minor"} level={"body2"}>
        Get merchandise
      </Typography>
      <div className={clsx(css.flex, styles.item)}>
        <span className={styles["item-icon"]}>🧦</span>
        <div className={css["flex-col"]}>
          <Typography className={css["t-medium"]} level={"body2"}>
            Socks
          </Typography>
          <Typography
            className={css["t-medium"]}
            color={"minor"}
            level={"body3"}
          >
            $19
          </Typography>
        </div>
      </div>
      <div className={clsx(css.flex, styles.item)}>
        <span className={styles["item-icon"]}>🔖</span>
        <div className={css["flex-col"]}>
          <Typography className={css["t-medium"]} level={"body2"}>
            Bookmark
          </Typography>
          <Typography
            className={css["t-medium"]}
            color={"minor"}
            level={"body3"}
          >
            $3
          </Typography>
        </div>
      </div>
      <div className={clsx(css.flex, styles.item)}>
        <span className={styles["item-icon"]}>👜</span>
        <div className={css["flex-col"]}>
          <Typography className={css["t-medium"]} level={"body2"}>
            Handbag
          </Typography>
          <Typography
            className={css["t-medium"]}
            color={"minor"}
            level={"body3"}
          >
            $120
          </Typography>
        </div>
      </div>
    </div>
  </div>
);

const RightSidebarItemsSection = (): React.ReactElement => (
  <section className={page_styles.section}>
    <div className={clsx(css.flex, page_styles["section-header"])}>
      <Typography
        className={clsx(page_styles.x, page_styles["section-title"])}
        level={"h2"}
      >
        Right sidebar items
      </Typography>
      <Typography level={"legible"}>
        Showcase up to five custom items on your blog&apos;s homepage, such as
        merchandise, sponsor links, or any other hyperlinks.
      </Typography>
    </div>
    <Preview />
  </section>
);

export default RightSidebarItemsSection;
