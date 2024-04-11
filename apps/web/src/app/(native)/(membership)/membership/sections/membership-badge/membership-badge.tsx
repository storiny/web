import { clsx } from "clsx";
import React from "react";

import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import page_styles from "../../styles.module.scss";
import Preview from "./preview";

const MembershipBadgeSection = (): React.ReactElement => (
  <section className={page_styles.section}>
    <div className={clsx(css.flex, page_styles["section-header"])}>
      <Typography
        className={clsx(page_styles.x, page_styles["section-title"])}
        level={"h2"}
      >
        Membership badge
      </Typography>
      <Typography level={"legible"}>
        Receive a badge on your profile for the duration of your membership as a
        token of gratitude for your contribution in keeping Storiny up and
        running.
      </Typography>
    </div>
    <Preview />
  </section>
);

export default MembershipBadgeSection;
