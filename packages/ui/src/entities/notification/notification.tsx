"use client";

import { NotificationType } from "@storiny/shared";
import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import Avatar from "~/components/avatar";
import Badge from "~/components/badge";
import DateTime from "~/components/date-time";
import Grow from "~/components/grow";
import Typography from "~/components/typography";
import NotificationParser from "~/entities/notification/parser";
import { use_media_query } from "~/hooks/use-media-query";
import AtIcon from "~/icons/at";
import CommentIcon from "~/icons/comment";
import HeartIcon from "~/icons/heart";
import LoginIcon from "~/icons/login";
import ReplyIcon from "~/icons/reply";
import ShieldIcon from "~/icons/shield";
import StoryIcon from "~/icons/story";
import TagIcon from "~/icons/tag";
import UserCheckIcon from "~/icons/user-check";
import UserHeartIcon from "~/icons/user-heart";
import UserPlusIcon from "~/icons/user-plus";
import VerifiedIcon from "~/icons/verified";
import { select_read_notification } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { DateFormat } from "~/utils/format-date";

import styles from "./notification.module.scss";
import { NotificationProps } from "./notification.props";

const Actions = dynamic(() => import("./actions"));

const NOTIFICATION_BADGE_CONTENT_MAP: Record<
  NotificationType,
  React.ReactNode
> = {
  [NotificationType.STORY_LIKE /*         */]: <HeartIcon no_stroke />,
  [NotificationType.FRIEND_REQ_ACCEPT /*  */]: <UserCheckIcon />,
  [NotificationType.FRIEND_REQ_RECEIVED /**/]: <UserHeartIcon />,
  [NotificationType.FOLLOWER_ADD /*       */]: <UserPlusIcon />,
  [NotificationType.STORY_MENTION /*      */]: <AtIcon />,
  [NotificationType.COMMENT_ADD /*        */]: <CommentIcon no_stroke />,
  [NotificationType.REPLY_ADD /*          */]: <ReplyIcon no_stroke />,
  [NotificationType.STORY_ADD_BY_USER /*  */]: <StoryIcon />,
  [NotificationType.STORY_ADD_BY_TAG /*   */]: <TagIcon no_stroke />,
  [NotificationType.SYSTEM /*             */]: <VerifiedIcon />,
  [NotificationType.LOGIN_ATTEMPT /*      */]: <VerifiedIcon />
};

const NOTIFICATION_BADGE_COLOR_MAP: Record<NotificationType, string> = {
  [NotificationType.STORY_LIKE /*         */]: "var(--blush-100)",
  [NotificationType.FRIEND_REQ_ACCEPT /*  */]: "var(--blush-100)",
  [NotificationType.FRIEND_REQ_RECEIVED /**/]: "var(--beryl-200)",
  [NotificationType.FOLLOWER_ADD /*       */]: "var(--beryl-200)",
  [NotificationType.STORY_MENTION /*      */]: "var(--beryl-200)",
  [NotificationType.COMMENT_ADD /*        */]: "var(--melon-100)",
  [NotificationType.REPLY_ADD /*          */]: "var(--melon-100)",
  [NotificationType.STORY_ADD_BY_USER /*  */]: "var(--plum-200)",
  [NotificationType.STORY_ADD_BY_TAG /*   */]: "var(--plum-200)",
  [NotificationType.SYSTEM /*             */]: "transparent",
  [NotificationType.LOGIN_ATTEMPT /*      */]: "transparent"
};

const SYSTEM_ICON_MAP: Record<number, React.ReactNode> = {
  [NotificationType.SYSTEM /*       */]: <ShieldIcon no_stroke />,
  [NotificationType.LOGIN_ATTEMPT /**/]: <LoginIcon />
};

const Notification = (props: NotificationProps): React.ReactElement => {
  const { className, notification, virtual, ...rest } = props;
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const is_read = use_app_selector(select_read_notification(notification.id));
  const is_system = [
    NotificationType.SYSTEM,
    NotificationType.LOGIN_ATTEMPT
  ].includes(notification.type);

  return (
    <div
      {...rest}
      className={clsx(
        css["flex"],
        styles.notification,
        is_read && styles.read,
        virtual && styles.virtual,
        className
      )}
      tabIndex={0}
    >
      <Badge
        badge_content={NOTIFICATION_BADGE_CONTENT_MAP[notification.type]}
        className={clsx(styles.badge, is_system && styles.system)}
        inset={"16%"}
        slot_props={{
          container: {
            style: {
              height: "fit-content"
            }
          }
        }}
        style={
          {
            "--bg": NOTIFICATION_BADGE_COLOR_MAP[notification.type]
          } as React.CSSProperties
        }
        visible={!is_mobile}
      >
        {is_system ? (
          <Avatar
            borderless={!is_mobile}
            className={styles["system-avatar"]}
            size={is_mobile ? "md" : "lg"}
            slot_props={{
              fallback: {
                style: {
                  "--bg": "var(--inverted-400)"
                } as React.CSSProperties
              }
            }}
          >
            {SYSTEM_ICON_MAP[notification.type]}
          </Avatar>
        ) : (
          <Avatar
            alt={`${notification.actor?.name}'s avatar`}
            avatar_id={notification.actor?.avatar_id}
            borderless={!is_mobile}
            hex={notification.actor?.avatar_hex}
            label={notification.actor?.name}
            size={is_mobile ? "md" : "lg"}
          />
        )}
      </Badge>
      <div className={css["flex-col"]}>
        <Typography as={"div"} className={styles.content}>
          <NotificationParser content={notification.rendered_content} />
        </Typography>
        <Typography className={css["t-minor"]} level={"body2"}>
          <DateTime
            date={notification.created_at}
            format={DateFormat.RELATIVE_CAPITALIZED}
          />
        </Typography>
      </div>
      <Grow />
      {!is_read && <Actions notification={notification} />}
    </div>
  );
};

export default React.memo(Notification);
