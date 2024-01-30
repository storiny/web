"use client";

import {
  Arrow,
  Content,
  Portal,
  Root,
  Trigger
} from "@radix-ui/react-hover-card";
import { ImageSize } from "@storiny/shared";
import clsx from "clsx";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Avatar from "~/components/avatar";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import UserPlusIcon from "~/icons/user-plus";
import { use_get_user_card_query } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";
import { get_cdn_url } from "~/utils/get-cdn-url";

import styles from "./user-hover-card.module.scss";
import { UserHoverCardProps } from "./user-hover-card.props";

const UserHoverCard = forward_ref<UserHoverCardProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    identifier,
    children,
    className,
    slot_props,
    ...rest
  } = props;
  const { data: user } = use_get_user_card_query(identifier);

  return (
    <Root {...rest}>
      <Trigger {...slot_props?.trigger} asChild>
        {children}
      </Trigger>
      <Portal {...slot_props?.portal}>
        <Content
          sideOffset={5}
          {...slot_props?.content}
          asChild
          className={clsx(styles.content, className)}
          ref={ref}
        >
          <Component>
            {user ? (
              <div className={css["flex-col"]}>
                <div className={styles.header}>
                  {user.banner_id && (
                    <AspectRatio
                      className={clsx(styles.x, styles.banner)}
                      ratio={3.45}
                    >
                      <Image
                        alt={""}
                        hex={user.banner_hex}
                        img_key={user.banner_id}
                        size={ImageSize.W_320}
                      />
                    </AspectRatio>
                  )}
                  <Avatar
                    alt={`${user.name}'s avatar`}
                    avatar_id={user.avatar_id}
                    className={clsx(
                      styles.x,
                      styles.avatar,
                      Boolean(user.banner_id) && styles["has-banner"]
                    )}
                    hex={user.avatar_hex}
                    label={user.name}
                    size={"lg"}
                  />
                </div>
                <div className={clsx(css["flex-col"], styles.details)}>
                  <IconButton className={clsx(styles.x, styles.action)}>
                    <UserPlusIcon />
                  </IconButton>
                  <div className={css["flex-col"]}>
                    <Link
                      className={css["t-bold"]}
                      ellipsis
                      fixed_color
                      href={`/${user.username}`}
                      style={{ maxWidth: "calc(100% - 48px)" }}
                    >
                      {user.name}
                    </Link>
                    <Link
                      ellipsis
                      href={`/${user.username}`}
                      level={"body2"}
                      style={{ maxWidth: "calc(100% - 48px)" }}
                    >
                      @{user.username}
                    </Link>
                  </div>
                  <Spacer orientation={"vertical"} size={2} />
                  <div className={clsx(css.flex, styles.stats)}>
                    <Typography color={"minor"} level={"body2"}>
                      <span className={clsx(css["t-medium"], css["t-major"])}>
                        {user.story_count}
                      </span>{" "}
                      {user.story_count === 1 ? "story" : "stories"}
                    </Typography>
                    <Typography color={"minor"} level={"body2"}>
                      <span className={clsx(css["t-medium"], css["t-major"])}>
                        {user.follower_count}
                      </span>{" "}
                      {user.follower_count === 1 ? "follower" : "followers"}
                    </Typography>
                  </div>
                </div>
              </div>
            ) : (
              "Loading"
            )}
            <Arrow
              {...slot_props?.arrow}
              className={clsx(styles.arrow, slot_props?.arrow?.className)}
            />
          </Component>
        </Content>
      </Portal>
    </Root>
  );
});

UserHoverCard.displayName = "UserHoverCard";

export default UserHoverCard;
