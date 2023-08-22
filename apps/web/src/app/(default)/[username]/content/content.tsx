import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import { Flag, UserFlag } from "~/common/flags";
import { GetProfileResponse } from "~/common/grpc";
import Avatar from "~/components/Avatar";
import Badge from "~/components/Badge";
import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Grow from "~/components/Grow";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Tooltip from "~/components/Tooltip";
import Typography from "~/components/Typography";
import Status from "~/entities/Status";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import CalendarIcon from "~/icons/Calendar";
import EditIcon from "~/icons/Edit";
import ForbidIcon from "~/icons/Forbid";
import InfoIcon from "~/icons/Info";
import LockIcon from "~/icons/Lock";
import MapPinIcon from "~/icons/MapPin";
import UserCheckIcon from "~/icons/UserCheck";
import UserPlusIcon from "~/icons/UserPlus";
import UserXIcon from "~/icons/UserX";
import { setBlock, setFollowing } from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { abbreviateNumber } from "~/utils/abbreviateNumber";
import { DateFormat, formatDate } from "~/utils/formatDate";

import ProfileActions from "../actions";
import Connections from "../connections";
import styles from "./content.module.scss";

const EarlyUserBadge = dynamic(() => import("~/entities/badges/EarlyUser"));
const StaffBadge = dynamic(() => import("~/entities/badges/Staff"));

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
  const dispatch = useAppDispatch();
  const isFollowing = useAppSelector(
    (state) => state.entities.following[profile.id]
  );
  const isBlocking = useAppSelector(
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
          checkAuth
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
            dispatch((isBlocking ? setBlock : setFollowing)([profile.id]));
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
    <span className={clsx("t-major", "t-bold")}>{abbreviateNumber(value)}</span>{" "}
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
  const willAvatarOverflow = useMediaQuery(
    `${breakpoints.up("tablet")} and ${breakpoints.down("desktop")}`
  );

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
          badgeContent={
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
              slotProps={{
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
              avatarId={profile.avatar_id}
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
                  value={profile.follower_count}
                />
                {!isPrivate && (
                  <>
                    {/* Following and friend count are returned as `null` when they are private */}
                    {typeof profile.following_count === "number" &&
                    profile.following_count > 0 ? (
                      <Stat
                        pluralLabel={"following"}
                        singularLabel={"following"}
                        value={profile.following_count}
                      />
                    ) : null}
                    {typeof profile.friend_count === "number" &&
                    profile.friend_count > 0 ? (
                      <Stat
                        pluralLabel={"friends"}
                        singularLabel={"friend"}
                        value={profile.friend_count}
                      />
                    ) : null}
                  </>
                )}
              </div>
              {!isPrivate && profile.status ? (
                <Status
                  className={clsx(styles.x, !isInsideSidebar && styles.status)}
                  emoji={profile.status.emoji}
                  expiresAt={profile.status.expires_at}
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
                  title={formatDate(profile.created_at)}
                >
                  Joined {formatDate(profile.created_at, DateFormat.RELATIVE)}
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
