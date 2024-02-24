import { clsx } from "clsx";
import React from "react";

import Avatar from "~/components/avatar";
import AvatarGroup from "~/components/avatar-group";
import Divider from "~/components/divider";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import page_styles from "../../styles.module.scss";
import styles from "./collaboration.module.scss";

const Caret = (): React.ReactElement => (
  <svg className={styles.caret} fill="none" viewBox="0 0 42 32">
    <path
      d="M2 14H0v17a1 1 0 1 0 2 0V14ZM42 2a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v12h40a2 2 0 0 0 2-2V2Z"
      fill="var(--inverted-200)"
    />
  </svg>
);

const Preview = (): React.ReactElement => (
  <div
    aria-hidden={"true"}
    className={clsx(css["flex-col"], page_styles.preview, styles.preview)}
  >
    <div className={clsx(css["flex-center"], styles.navbar)}>
      <Avatar
        hex={"9e7b65"}
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/w@64/web-assets/presentational/avatars/1`}
      />
      <Avatar
        hex={"322215"}
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/w@64/web-assets/presentational/avatars/2`}
      />
      <Avatar
        hex={"4e413c"}
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/w@64/web-assets/presentational/avatars/3`}
      />
      <Divider orientation={"vertical"} style={{ marginBlock: "13.5px" }} />
      <AvatarGroup
        style={
          { "--border-color": "var(--bg-elevation-sm)" } as React.CSSProperties
        }
      >
        <Avatar
          hex={"b5b5b5"}
          src={`${process.env.NEXT_PUBLIC_CDN_URL}/w@64/web-assets/presentational/avatars/4`}
        />
        <Avatar
          hex={"e1d1b2"}
          src={`${process.env.NEXT_PUBLIC_CDN_URL}/w@64/web-assets/presentational/avatars/5`}
        />
        <Avatar
          hex={"c6c0b5"}
          src={`${process.env.NEXT_PUBLIC_CDN_URL}/w@64/web-assets/presentational/avatars/6`}
        />
      </AvatarGroup>
    </div>
    <div
      className={clsx(css["f-grow"], css.flex)}
      style={{ justifyContent: "space-between" }}
    >
      <span className={styles.lsb} />
      <div className={clsx(css["f-grow"], styles.body)}>
        <Caret />
        <Caret />
        <Caret />
      </div>
      <span className={styles.rsb} />
    </div>
  </div>
);

const CollaborationSection = (): React.ReactElement => (
  <section className={page_styles.section}>
    <div className={clsx(css.flex, page_styles["section-header"])}>
      <Typography
        className={clsx(page_styles.x, page_styles["section-title"])}
        level={"h2"}
      >
        Better together
      </Typography>
      <Typography level={"legible"}>
        Invite up to 15 contributors to exchange ideas and contribute to your
        stories in real time.
      </Typography>
    </div>
    <Preview />
  </section>
);

export default CollaborationSection;
