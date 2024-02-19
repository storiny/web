import { clsx } from "clsx";
import React from "react";

import Tab from "~/components/tab";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import page_styles from "../../styles.module.scss";
import styles from "./left-sidebar-items.module.scss";

const Preview = (): React.ReactElement => (
  <div
    aria-hidden={"true"}
    className={clsx(css.flex, page_styles.preview, styles.preview)}
  >
    <div className={clsx(css["flex-col"], styles.lsb)}>
      <Tabs defaultValue={"home"} orientation={"vertical"} role={undefined}>
        <TabsList
          aria-orientation={undefined}
          className={clsx(css["full-w"], styles["tabs-list"])}
          loop={false}
          role={undefined}
          size={"lg"}
        >
          <Tab className={clsx(styles.x, styles.tab)} value={"home"}>
            Home
          </Tab>
          <Tab className={clsx(styles.x, styles.tab)} value={"about"}>
            About
          </Tab>
          <Tab className={clsx(styles.x, styles.tab)} value={"newsletter"}>
            Newsletter
          </Tab>
          <Tab className={clsx(styles.x, styles.tab)} value={"editors"}>
            Editors
          </Tab>
          <Tab className={clsx(styles.x, styles.tab)} value={"archive"}>
            Archive
          </Tab>
        </TabsList>
      </Tabs>
    </div>
    <span className={styles.body} />
    <span className={styles.rsb} />
  </div>
);

const LeftSidebarItemsSection = (): React.ReactElement => (
  <section className={page_styles.section}>
    <div className={clsx(css.flex, page_styles["section-header"])}>
      <Typography
        className={clsx(page_styles.x, page_styles["section-title"])}
        level={"h2"}
      >
        Left sidebar items
      </Typography>
      <Typography level={"legible"}>
        Add up to five custom navigation tabs on your blog’s homepage that link
        to a webpage inside or outside Storiny.
      </Typography>
    </div>
    <Preview />
  </section>
);

export default LeftSidebarItemsSection;
