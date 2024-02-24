"use client";

import { clsx } from "clsx";
import React from "react";

import Avatar from "~/components/avatar";
import Button from "~/components/button";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { PlusBadge } from "~/entities/badges";
import PlusIcon from "~/icons/plus";
import { select_user } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import page_styles from "../../styles.module.scss";
import styles from "./membership-badge.module.scss";

const Preview = (): React.ReactElement => {
  const user = use_app_selector(select_user);
  return (
    <div
      aria-hidden={"true"}
      className={clsx(css.flex, page_styles.preview, styles.preview)}
    >
      <span className={styles.lsb} />
      <span className={styles.body} />
      <div className={clsx(css["flex-col"], styles.rsb)}>
        <div
          style={{ opacity: "15%", pointerEvents: "none", maxWidth: "100%" }}
        >
          <div className={clsx(css["flex-center"], styles.header)}>
            {user?.avatar_id ? (
              <Avatar
                alt={""}
                avatar_id={user.avatar_id}
                hex={user.avatar_hex}
                label={user.name}
                size={"xl"}
              />
            ) : (
              <Avatar
                hex={"9e7b65"}
                size={"xl"}
                src={`${process.env.NEXT_PUBLIC_CDN_URL}/w@64/web-assets/presentational/avatars/1`}
              />
            )}
            <Grow />
            <Button decorator={<PlusIcon />}>Follow</Button>
          </div>
          <Spacer orientation={"vertical"} size={2} />
          <Typography as={"p"} ellipsis level={"h4"}>
            {user?.name || "Louie Chiba"}
          </Typography>
          <Typography ellipsis level={"body2"}>
            @{user?.username || "louie"}
          </Typography>
        </div>
        {/* Spacer span */}
        <span />
        <Typography className={css["t-medium"]} color={"minor"} level={"body3"}>
          BADGES
        </Typography>
        <PlusBadge />
      </div>
    </div>
  );
};

export default Preview;
