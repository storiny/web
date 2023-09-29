import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import { Flag, UserFlag } from "~/common/flags";
import { GetProfileResponse } from "~/common/grpc";
import Avatar from "../../../../../../../packages/ui/src/components/avatar";
import Badge from "../../../../../../../packages/ui/src/components/badge";
import Button from "../../../../../../../packages/ui/src/components/button";
import Divider from "../../../../../../../packages/ui/src/components/divider";
import Grow from "../../../../../../../packages/ui/src/components/grow";
import Link from "../../../../../../../packages/ui/src/components/link";
import Spacer from "../../../../../../../packages/ui/src/components/spacer";
import Tooltip from "../../../../../../../packages/ui/src/components/tooltip";
import Typography from "../../../../../../../packages/ui/src/components/typography";
import Status from "../../../../../../../packages/ui/src/entities/status";
import { use_media_query } from "../../../../../../../packages/ui/src/hooks/use-media-query";
import CalendarIcon from "~/icons/Calendar";
import EditIcon from "~/icons/Edit";
import ForbidIcon from "~/icons/Forbid";
import InfoIcon from "~/icons/Info";
import LockIcon from "~/icons/Lock";
import MapPinIcon from "~/icons/MapPin";
import UserCheckIcon from "~/icons/UserCheck";
import UserPlusIcon from "~/icons/UserPlus";
import UserXIcon from "~/icons/UserX";
import { boolean_action } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { abbreviate_number } from "../../../../../../../packages/ui/src/utils/abbreviate-number";
import {
  DateFormat,
  format_date
} from "../../../../../../../packages/ui/src/utils/format-date";

import ProfileActions from "../actions";
import Connections from "../connections";
import styles from "./content.module.scss";

const EarlyUserBadge = dynamic(
  () =>
    import("../../../../../../../packages/ui/src/entities/badges/early-user")
);
const StaffBadge = dynamic(
  () => import("../../../../../../../packages/ui/src/entities/badges/staff")
);

interface Props {
  isInsideSidebar?: boolean;
  isPrivate: boolean;
  isSuspended: boolean;
  profile: GetProfileResponse;
}

// Actions

const Actions = ({
  profile,
  isInsideSidebar
}: Pick<Props, "isInsideSidebar" | "profile">): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const isFollowing = use_app_selector(
    (state) => state.entities.following[profile.id]
  );
  const isBlocking = use_app_selector(
    (state) => state.entities.blocks[profile.id]
  );
  const isSelf = Boolean(profile.is_self);

  // Received state with synced with the browser state in `ProfileActions`.

  return (
    <div
      className={clsx(
        "flex",
        styles.x,
        styles.actions,
        isInsideSidebar && styles["inside-sidebar"]
      )}
    >
      {!profile.is_blocked_by_user && (
        <Button
          check_auth
          color={isBlocking ? "ruby" : "inverted"}
          decorator={
            isSelf ? (
              <EditIcon />
            ) : isBlocking ? (
              <UserXIcon />
            ) : isFollowing ? (
              <UserCheckIcon />
            ) : (
              <UserPlusIcon />
            )
          }
          onClick={(): void => {
            dispatch(
              boolean_action(isBlocking ? "blocks" : "following", profile.id)
            );
          }}
          size={isInsideSidebar ? "md" : "lg"}
          variant={isSelf || isFollowing ? "hollow" : "rigid"}
          {...(isSelf && { as: NextLink, href: "/me" })}
        >
          {isSelf
            ? "Edit"
            : isBlocking
            ? "Unblock"
            : isFollowing
            ? "Following"
            : "Follow"}
        </Button>
      )}
      <ProfileActions isInsideSidebar={isInsideSidebar} profile={profile} />
    </div>
  );
};

// Stat block

const Stat = ({
  value,
  singularLabel,
  pluralLabel
}: {
  pluralLabel: string;
  singularLabel: string;
  value: number;
}): React.ReactElement => (
  <Typography
    level={"body2"}
    title={`${value.toLocaleString()} ${
      value === 1 ? singularLabel : pluralLabel
    }`}
  >
    <span className={clsx("t-major", "t-bold")}>
      {abbreviate_number(value)}
    </span>{" "}
    <span className={clsx("t-minor", "t-medium")}>
      {value === 1 ? singularLabel : pluralLabel}
    </span>
  </Typography>
);

// Badges block

const Badges = ({
  publicFlags
}: {
  publicFlags: Props["profile"]["public_flags"];
}): React.ReactElement | null => {
  const flags = new Flag(publicFlags);

  if (flags.none()) {
    return null;
  }

  return (
    <div className={clsx("flex-col", styles.x, styles["container"])}>
      <Title>
        Badges
        <Tooltip
          content={
            <>
              Badges represent a user&apos;s achievements, affiliations, or
              accomplishments.{" "}
              <Link href={"/docs/badges"} underline={"always"}>
                Learn more
              </Link>
            </>
          }
          delayDuration={0}
        >
          <InfoIcon className={clsx(styles.x, styles["badge-hint"])} />
        </Tooltip>
      </Title>
      <div className={clsx("flex", styles.x, styles["badges-container"])}>
        {flags.hasAnyOf(UserFlag.STAFF) && (
          <span
            className={clsx("flex-center", styles.x, styles["badge-wrapper"])}
          >
            <StaffBadge />
          </span>
        )}
        {flags.hasAnyOf(UserFlag.EARLY_USER) && (
          <span
            className={clsx("flex-center", styles.x, styles["badge-wrapper"])}
          >
            <EarlyUserBadge />
          </span>
        )}
      </div>
    </div>
  );
};

// Block title

const Title = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <Typography
    as={"h2"}
    className={clsx("flex", "t-bold", "t-minor", styles.x, styles.title)}
    level={"body3"}
  >
    {children}
  </Typography>
);

const ProfileContent = ({
  profile,
  isInsideSidebar,
  isSuspended,
  isPrivate
}: Props): React.ReactElement => {
  const willAvatarOverflow = use_media_query(
    `${BREAKPOINTS.up("tablet")} and ${BREAKPOINTS.down("desktop")}`
  );
  const follower_count =
    use_app_selector((state) => state.entities.follower_counts[profile.id]) ||
    0;
  const followingCount =
    use_app_selector((state) => state.entities.followingCounts[profile.id]) ||
    0;
  const friendCount =
    use_app_selector((state) => state.entities.friendCounts[profile.id]) || 0;

  return (
    <>
      {/* Header (Avatar and actions) */}
      <div
        className={clsx(
          "flex-center",
          styles.x,
          styles.header,
          isInsideSidebar && styles["inside-sidebar"]
        )}
      >
        <Badge
          badge_content={
            <Tooltip content={"Your account is private"} delayDuration={0}>
              <LockIcon />
            </Tooltip>
          }
          className={clsx(styles.x, styles.badge)}
          elevation={isInsideSidebar ? "xs" : "body"}
          inset={isInsideSidebar ? "15%" : "24%"}
          visible={profile.is_self && profile.is_private}
        >
          {isPrivate || isSuspended ? (
            <Avatar
              alt={""}
              className={clsx(
                styles.x,
                styles.avatar,
                isInsideSidebar && styles["inside-sidebar"]
              )}
              size={willAvatarOverflow ? "xl" : "xl2"}
              slot_props={{
                fallback: {
                  style: {
                    "--icon-size": "32px",
                    "--icon-stroke": "var(--inverted-0)",
                    "--bg": "var(--inverted-400)"
                  } as React.CSSProperties
                }
              }}
            >
              {isPrivate ? <LockIcon /> : <ForbidIcon />}
            </Avatar>
          ) : (
            <Avatar
              alt={""}
              avatar_id={profile.avatar_id}
              borderless={Boolean(profile.banner_id) && !isInsideSidebar}
              className={clsx(
                styles.x,
                styles.avatar,
                Boolean(profile.banner_id) && styles["has-banner"],
                isInsideSidebar && styles["inside-sidebar"]
              )}
              hex={profile.avatar_hex}
              label={profile.name}
              size={willAvatarOverflow ? "xl" : "xl2"}
            />
          )}
        </Badge>
        <Grow />
        {!isSuspended && (
          <Actions isInsideSidebar={isInsideSidebar} profile={profile} />
        )}
      </div>
      <div className={clsx("flex-col", styles.x, styles.properties)}>
        {/* Details (Name, username, statistics, and status) */}
        <div className={clsx("flex-col", styles.x, styles.details)}>
          <div className={"flex-col"}>
            <Typography as={"h1"} ellipsis level={"h3"}>
              {profile.name}
            </Typography>
            <Typography
              className={clsx("t-medium", "t-minor")}
              ellipsis
              level={"body1"}
            >
              @{profile.username}
            </Typography>
          </div>
          {!isSuspended && !profile.is_blocked_by_user ? (
            <>
              <div className={clsx("flex", styles.x, styles.stats)}>
                {!isPrivate && (
                  <Stat
                    pluralLabel={"stories"}
                    singularLabel={"story"}
                    value={profile.story_count}
                  />
                )}
                <Stat
                  pluralLabel={"followers"}
                  singularLabel={"follower"}
                  value={follower_count}
                />
                {!isPrivate && (
                  <>
                    {/* Following and friend count are returned as `null` when they are private */}
                    {typeof profile.following_count === "number" &&
                    followingCount > 0 ? (
                      <Stat
                        pluralLabel={"following"}
                        singularLabel={"following"}
                        value={followingCount}
                      />
                    ) : null}
                    {typeof profile.friend_count === "number" &&
                    friendCount > 0 ? (
                      <Stat
                        pluralLabel={"friends"}
                        singularLabel={"friend"}
                        value={friendCount}
                      />
                    ) : null}
                  </>
                )}
              </div>
              {!isPrivate && profile.status ? (
                <Status
                  className={clsx(styles.x, !isInsideSidebar && styles.status)}
                  emoji={profile.status.emoji}
                  expires_at={profile.status.expires_at}
                  text={profile.status.text}
                />
              ) : null}
            </>
          ) : null}
        </div>
        {isPrivate ||
        isSuspended ||
        Boolean(profile.is_blocked_by_user) ? null : (
          <>
            {/* Badges */}
            <Badges publicFlags={profile.public_flags} />
            {/* Bio */}
            {Boolean(profile.bio) && (
              <div className={clsx("flex-col", styles.x, styles["container"])}>
                <Title>About</Title>
                <Typography className={"t-minor"} level={"body2"}>
                  {profile.bio}
                </Typography>
              </div>
            )}
            {/* List (Location and joining date) */}
            <ul className={clsx("flex-col", styles.x, styles.list)}>
              {Boolean(profile.location) && (
                <li className={clsx("flex", styles.x, styles["list-item"])}>
                  <MapPinIcon />
                  <Typography
                    as={"span"}
                    className={"t-minor"}
                    ellipsis
                    level={"body2"}
                    title={profile.location}
                  >
                    {profile.location}
                  </Typography>
                </li>
              )}
              <li className={clsx("flex", styles.x, styles["list-item"])}>
                <CalendarIcon />
                <Typography
                  as={"time"}
                  className={"t-minor"}
                  dateTime={profile.created_at}
                  level={"body2"}
                  title={format_date(profile.created_at)}
                >
                  Joined {format_date(profile.created_at, DateFormat.RELATIVE)}
                </Typography>
              </li>
            </ul>
            {/* Connections */}
            {Boolean(profile.connections.length) && (
              <div
                className={clsx(
                  "flex-col",
                  styles.x,
                  styles["connections-container"]
                )}
              >
                <Title>Connections</Title>
                <Connections
                  connections={profile.connections}
                  isInsideSidebar={isInsideSidebar}
                  name={profile.name}
                />
              </div>
            )}
          </>
        )}
      </div>
      {!isInsideSidebar && <Spacer orientation={"vertical"} size={3} />}
      {(isPrivate || isSuspended || Boolean(profile.is_blocked_by_user)) &&
      !isInsideSidebar ? (
        <Divider
          style={{ width: "auto", marginInline: "var(--grid-compensation)" }}
        />
      ) : null}
    </>
  );
};

export default ProfileContent;
