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
import BadgeArray from "~/components/badge-array";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import BioParser from "~/entities/bio-parser";
import Status from "~/entities/status";
import UserCheckIcon from "~/icons/user-check";
import UserPlusIcon from "~/icons/user-plus";
import {
  boolean_action,
  select_user,
  sync_with_user,
  use_get_user_card_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";
import { forward_ref } from "~/utils/forward-ref";

import UserHoverCardSkeleton from "./skeleton";
import styles from "./user-hover-card.module.scss";
import { UserHoverCardProps } from "./user-hover-card.props";

const UserHoverCardContent = ({
  identifier
}: Pick<UserHoverCardProps, "identifier">): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const current_user = use_app_selector(select_user);
  const {
    data: user,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error
  } = use_get_user_card_query(identifier);
  const follower_count =
    use_app_selector(
      (state) => state.entities.follower_counts[user?.id || ""]
    ) || 0;
  const is_following = use_app_selector(
    (state) => state.entities.following[user?.id || ""]
  );
  const is_blocked = use_app_selector(
    (state) => state.entities.blocks[user?.id || ""]
  );
  const is_self = user?.id === current_user?.id;

  React.useEffect(() => {
    if (user) {
      dispatch(sync_with_user(user));
    }
  }, [dispatch, user]);

  return is_loading || is_fetching ? (
    <UserHoverCardSkeleton />
  ) : !user || is_error ? (
    <Typography className={css["t-center"]} color={"minor"} level={"body2"}>
      {error && "status" in error && error.status === 404
        ? "Unknown user"
        : "Unable to get the details for this user"}
    </Typography>
  ) : (
    <div className={css["flex-col"]}>
      <div className={styles.header}>
        {user.banner_id && (
          <AspectRatio className={clsx(styles.x, styles.banner)} ratio={3.45}>
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
          slot_props={{
            image: {
              // For transparent avatars over the banner.
              style: { background: "var(--bg-elevation-sm)" }
            }
          }}
        />
        {!is_self && (
          <IconButton
            aria-label={is_following ? "Unfollow" : "Follow"}
            check_auth
            className={clsx(
              styles.x,
              styles.action,
              Boolean(user.banner_id) && styles["has-banner"]
            )}
            disabled={is_blocked}
            onClick={(): void => {
              dispatch(boolean_action("following", user.id));
            }}
            title={`${is_following ? "Unfollow" : "Follow"} ${user.name}`}
            variant={is_following ? "hollow" : "rigid"}
          >
            {is_following ? <UserCheckIcon /> : <UserPlusIcon />}
          </IconButton>
        )}
      </div>
      <div className={css["flex-col"]}>
        <div className={clsx(css["flex-col"], styles.meta)}>
          <Link
            className={css["t-bold"]}
            ellipsis
            fixed_color
            href={`/${user.username}`}
          >
            {user.name}
          </Link>
          <Link
            className={clsx(css.flex, styles.sub)}
            href={`/${user.username}`}
            level={"body2"}
          >
            <span className={css.ellipsis}>@{user.username} </span>
            <BadgeArray
              flags={user.public_flags}
              is_plus_member={user.is_plus_member}
              size={14}
            />
          </Link>
        </div>
        {Boolean((user.rendered_bio || "").trim()) && (
          <Typography as={"div"} className={styles.bio} color={"minor"}>
            <BioParser content={user.rendered_bio} disable_hovercards />
          </Typography>
        )}
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
              {abbreviate_number(follower_count)}
            </span>{" "}
            {follower_count === 1 ? "follower" : "followers"}
          </Typography>
        </div>
        {user.status && (
          <React.Fragment>
            <Spacer orientation={"vertical"} size={2} />
            <Status
              className={clsx(styles.x, styles.status)}
              editable={false}
              emoji={user.status.emoji ?? undefined}
              expires_at={user.status.expires_at ?? undefined}
              text={user.status.text ?? undefined}
              user_id={user.id}
            />
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

const UserHoverCard = forward_ref<UserHoverCardProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    identifier,
    children,
    className,
    slot_props,
    ...rest
  } = props;

  return (
    <Root {...rest}>
      <Trigger {...slot_props?.trigger} asChild>
        {children}
      </Trigger>
      <Portal {...slot_props?.portal}>
        <Content
          collisionPadding={12}
          side={"top"}
          sideOffset={5}
          {...slot_props?.content}
          asChild
          className={clsx(styles.content, className)}
          ref={ref}
        >
          <Component>
            <UserHoverCardContent identifier={identifier} />
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
