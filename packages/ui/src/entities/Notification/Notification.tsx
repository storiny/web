"use client";

import { NotificationType } from "@storiny/types";
import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import Avatar from "~/components/Avatar";
import Badge from "~/components/Badge";
import Grow from "~/components/Grow";
import Typography from "~/components/Typography";
import NotificationParser from "~/entities/Notification/Parser";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import AtIcon from "~/icons/At";
import CommentIcon from "~/icons/Comment";
import HeartIcon from "~/icons/Heart";
import LoginIcon from "~/icons/Login";
import ReplyIcon from "~/icons/Reply";
import ShieldIcon from "~/icons/Shield";
import StoryIcon from "~/icons/Story";
import TagIcon from "~/icons/Tag";
import UserCheckIcon from "~/icons/UserCheck";
import UserHeartIcon from "~/icons/UserHeart";
import UserPlusIcon from "~/icons/UserPlus";
import VerifiedIcon from "~/icons/Verified";
import { selectReadNotification } from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { DateFormat, formatDate } from "~/utils/formatDate";

import styles from "./Notification.module.scss";
import { NotificationProps } from "./Notification.props";

const Actions = dynamic(() => import("./Actions"));

const notificationBadgeContentMap: Record<NotificationType, React.ReactNode> = {
  [NotificationType.STORY_LIKE /*         */]: <HeartIcon noStroke />,
  [NotificationType.FRIEND_REQ_ACCEPT /*  */]: <UserCheckIcon />,
  [NotificationType.FRIEND_REQ_RECEIVED /**/]: <UserHeartIcon />,
  [NotificationType.FOLLOWER_ADD /*       */]: <UserPlusIcon />,
  [NotificationType.STORY_MENTION /*      */]: <AtIcon />,
  [NotificationType.COMMENT_ADD /*        */]: <CommentIcon noStroke />,
  [NotificationType.REPLY_ADD /*          */]: <ReplyIcon noStroke />,
  [NotificationType.STORY_ADD_BY_USER /*  */]: <StoryIcon />,
  [NotificationType.STORY_ADD_BY_TAG /*   */]: <TagIcon noStroke />,
  [NotificationType.SYSTEM /*             */]: <VerifiedIcon />,
  [NotificationType.LOGIN_ATTEMPT /*      */]: <VerifiedIcon />
};

const notificationBadgeColorMap: Record<NotificationType, string> = {
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

const systemIconMap: Record<number, React.ReactNode> = {
  [NotificationType.SYSTEM /*       */]: <ShieldIcon noStroke />,
  [NotificationType.LOGIN_ATTEMPT /**/]: <LoginIcon />
};

const Notification = (props: NotificationProps): React.ReactElement => {
  const { className, notification, ...rest } = props;
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const isRead = useAppSelector(selectReadNotification(notification.id));
  const isSystem = [
    NotificationType.SYSTEM,
    NotificationType.LOGIN_ATTEMPT
  ].includes(notification.type);

  return (
    <div
      {...rest}
      className={clsx(
        "flex",
        styles.notification,
        isRead && styles.read,
        className
      )}
      tabIndex={0}
    >
      <Badge
        badgeContent={notificationBadgeContentMap[notification.type]}
        className={clsx(styles.badge, isSystem && styles.system)}
        inset={"16%"}
        slotProps={{
          container: {
            style: {
              height: "fit-content"
            }
          }
        }}
        style={
          {
            "--bg": notificationBadgeColorMap[notification.type]
          } as React.CSSProperties
        }
        visible={!isMobile}
      >
        {isSystem ? (
          <Avatar
            borderless={!isMobile}
            className={styles["system-avatar"]}
            size={isMobile ? "md" : "lg"}
            slotProps={{
              fallback: {
                style: {
                  "--bg": "var(--inverted-400)"
                } as React.CSSProperties
              }
            }}
          >
            {systemIconMap[notification.type]}
          </Avatar>
        ) : (
          <Avatar
            alt={`${notification.actor?.name}'s avatar`}
            avatarId={notification.actor?.avatar_id}
            borderless={!isMobile}
            hex={notification.actor?.avatar_hex}
            label={notification.actor?.name}
            size={isMobile ? "md" : "lg"}
          />
        )}
      </Badge>
      <div className={"flex-col"}>
        <Typography as={"div"} className={styles.content}>
          <NotificationParser content={notification.rendered_content} />
        </Typography>
        <Typography className={"t-minor"} level={"body2"}>
          {formatDate(notification.created_at, DateFormat.RELATIVE_CAPITALIZED)}
        </Typography>
      </div>
      <Grow />
      {!isRead && <Actions notification={notification} />}
    </div>
  );
};

export default React.memo(Notification);
