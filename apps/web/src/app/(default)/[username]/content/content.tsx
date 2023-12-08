"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import { Flag, UserFlag } from "~/common/flags";
import { GetProfileResponse } from "~/common/grpc";
import Avatar from "~/components/avatar";
import Badge from "~/components/badge";
import Button from "~/components/button";
import Divider from "~/components/divider";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Tooltip from "~/components/tooltip";
import Typography from "~/components/typography";
import BioParser from "~/entities/bio-parser";
import Status from "~/entities/status";
import { use_media_query } from "~/hooks/use-media-query";
import CalendarIcon from "~/icons/calendar";
import EditIcon from "~/icons/edit";
import ForbidIcon from "~/icons/forbid";
import InfoIcon from "~/icons/info";
import LockIcon from "~/icons/lock";
import MapPinIcon from "~/icons/map-pin";
import UserCheckIcon from "~/icons/user-check";
import UserPlusIcon from "~/icons/user-plus";
import UserXIcon from "~/icons/user-x";
import { boolean_action } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";
import { DateFormat, format_date } from "~/utils/format-date";

import ProfileActions from "../actions";
import Connections from "../connections";
import styles from "./content.module.scss";

const EarlyUserBadge = dynamic(() => import("~/entities/badges/early-user"));
const StaffBadge = dynamic(() => import("~/entities/badges/staff"));

interface Props {
  is_inside_sidebar?: boolean;
  is_private: boolean;
  is_suspended: boolean;
  profile: GetProfileResponse;
}

// Actions

const Actions = ({
  profile,
  is_inside_sidebar
}: Pick<Props, "is_inside_sidebar" | "profile">): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const is_following = use_app_selector(
    (state) => state.entities.following[profile.id]
  );
  const is_blocking = use_app_selector(
    (state) => state.entities.blocks[profile.id]
  );
  const is_self = Boolean(profile.is_self);

  // Received state with synced with the browser state in `ProfileActions`.

  return (
    <div
      className={clsx(
        css["flex"],
        styles.actions,
        is_inside_sidebar && styles["inside-sidebar"]
      )}
    >
      {!profile.is_blocked_by_user && (
        <Button
          check_auth
          color={is_blocking ? "ruby" : "inverted"}
          decorator={
            is_self ? (
              <EditIcon />
            ) : is_blocking ? (
              <UserXIcon />
            ) : is_following ? (
              <UserCheckIcon />
            ) : (
              <UserPlusIcon />
            )
          }
          onClick={(): void => {
            dispatch(
              boolean_action(is_blocking ? "blocks" : "following", profile.id)
            );
          }}
          size={is_inside_sidebar ? "md" : "lg"}
          variant={is_self || is_following ? "hollow" : "rigid"}
          {...(is_self && { as: NextLink, href: "/me" })}
        >
          {is_self
            ? "Edit"
            : is_blocking
            ? "Unblock"
            : is_following
            ? "Following"
            : "Follow"}
        </Button>
      )}
      <ProfileActions is_inside_sidebar={is_inside_sidebar} profile={profile} />
    </div>
  );
};

// Stat block

const Stat = ({
  value,
  singular_label,
  plural_label
}: {
  plural_label: string;
  singular_label: string;
  value: number;
}): React.ReactElement => (
  <Typography
    level={"body2"}
    title={`${value.toLocaleString()} ${
      value === 1 ? singular_label : plural_label
    }`}
  >
    <span className={clsx(css["t-major"], css["t-bold"])}>
      {abbreviate_number(value)}
    </span>{" "}
    <span className={clsx(css["t-minor"], css["t-medium"])}>
      {value === 1 ? singular_label : plural_label}
    </span>
  </Typography>
);

// Badges block

const Badges = ({
  public_flags
}: {
  public_flags: Props["profile"]["public_flags"];
}): React.ReactElement | null => {
  const flags = new Flag(public_flags);

  if (flags.none()) {
    return null;
  }

  return (
    <div className={clsx(css["flex-col"], styles["container"])}>
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
      <div className={clsx(css["flex"], styles["badges-container"])}>
        {flags.has_any_of(UserFlag.STAFF) && (
          <span className={clsx(css["flex-center"], styles["badge-wrapper"])}>
            <StaffBadge />
          </span>
        )}
        {flags.has_any_of(UserFlag.EARLY_USER) && (
          <span className={clsx(css["flex-center"], styles["badge-wrapper"])}>
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
    className={clsx(
      css["flex"],
      css["t-bold"],
      css["t-minor"],
      styles.x,
      styles.title
    )}
    level={"body3"}
  >
    {children}
  </Typography>
);

const ProfileContent = ({
  profile,
  is_inside_sidebar,
  is_suspended,
  is_private
}: Props): React.ReactElement => {
  const will_avatar_overflow = use_media_query(
    `${BREAKPOINTS.up("tablet")} and ${BREAKPOINTS.down("desktop")}`
  );
  const follower_count =
    use_app_selector((state) => state.entities.follower_counts[profile.id]) ||
    0;
  const following_count =
    use_app_selector((state) => state.entities.following_counts[profile.id]) ||
    0;
  const friend_count =
    use_app_selector((state) => state.entities.friend_counts[profile.id]) || 0;

  return (
    <>
      {/* Header (Avatar and actions) */}
      <div
        className={clsx(
          css["flex-center"],
          styles.header,
          is_inside_sidebar && styles["inside-sidebar"]
        )}
      >
        <Badge
          badge_content={
            <Tooltip content={"Your account is private"} delayDuration={0}>
              <LockIcon />
            </Tooltip>
          }
          className={clsx(styles.x, styles.badge)}
          elevation={is_inside_sidebar ? "xs" : "body"}
          inset={is_inside_sidebar ? "15%" : "24%"}
          visible={profile.is_self && profile.is_private}
        >
          {is_private || is_suspended ? (
            <Avatar
              alt={""}
              className={clsx(
                styles.x,
                styles.avatar,
                is_inside_sidebar && styles["inside-sidebar"]
              )}
              size={will_avatar_overflow ? "xl" : "xl2"}
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
              {is_private ? <LockIcon /> : <ForbidIcon />}
            </Avatar>
          ) : (
            <Avatar
              alt={""}
              avatar_id={profile.avatar_id}
              borderless={Boolean(profile.banner_id) && !is_inside_sidebar}
              className={clsx(
                styles.x,
                styles.avatar,
                Boolean(profile.banner_id) && styles["has-banner"],
                is_inside_sidebar && styles["inside-sidebar"]
              )}
              hex={profile.avatar_hex}
              label={profile.name}
              size={will_avatar_overflow ? "xl" : "xl2"}
            />
          )}
        </Badge>
        <Grow />
        {!is_suspended && (
          <Actions is_inside_sidebar={is_inside_sidebar} profile={profile} />
        )}
      </div>
      <div className={clsx(css["flex-col"], styles.properties)}>
        {/* Details (Name, username, statistics, and status) */}
        <div className={clsx(css["flex-col"], styles.details)}>
          <div className={css["flex-col"]}>
            <Typography as={"h1"} ellipsis level={"h3"}>
              {profile.name}
            </Typography>
            <Typography
              className={clsx(css["t-medium"], css["t-minor"])}
              ellipsis
              level={"body1"}
            >
              @{profile.username}
            </Typography>
          </div>
          {!is_suspended && !profile.is_blocked_by_user ? (
            <>
              <div className={clsx(css["flex"], styles.stats)}>
                {!is_private && (
                  <Stat
                    plural_label={"stories"}
                    singular_label={"story"}
                    value={profile.story_count}
                  />
                )}
                <Stat
                  plural_label={"followers"}
                  singular_label={"follower"}
                  value={follower_count}
                />
                {!is_private && (
                  <>
                    {/* Following and friend count are returned as `null` when they are private */}
                    {typeof profile.following_count === "number" &&
                    following_count > 0 ? (
                      <Stat
                        plural_label={"following"}
                        singular_label={"following"}
                        value={following_count}
                      />
                    ) : null}
                    {typeof profile.friend_count === "number" &&
                    friend_count > 0 ? (
                      <Stat
                        plural_label={"friends"}
                        singular_label={"friend"}
                        value={friend_count}
                      />
                    ) : null}
                  </>
                )}
              </div>
              {!is_private && profile.status ? (
                <Status
                  className={clsx(
                    styles.x,
                    !is_inside_sidebar && styles.status
                  )}
                  emoji={profile.status.emoji}
                  expires_at={profile.status.expires_at}
                  text={profile.status.text}
                />
              ) : null}
            </>
          ) : null}
        </div>
        {is_private ||
        is_suspended ||
        Boolean(profile.is_blocked_by_user) ? null : (
          <>
            {/* Badges */}
            <Badges public_flags={profile.public_flags} />
            {/* Bio */}
            {Boolean((profile.rendered_bio || "").trim()) && (
              <div className={clsx(css["flex-col"], styles.container)}>
                <Title>About</Title>
                <Typography className={css["t-minor"]} level={"body2"}>
                  <BioParser content={profile.rendered_bio} />
                </Typography>
              </div>
            )}
            {/* List (Location and joining date) */}
            <ul className={clsx(css["flex-col"], styles.list)}>
              {Boolean(profile.location.trim()) && (
                <li className={clsx(css["flex"], styles["list-item"])}>
                  <MapPinIcon />
                  <Typography
                    as={"span"}
                    className={css["t-minor"]}
                    ellipsis
                    level={"body2"}
                    title={profile.location}
                  >
                    {profile.location}
                  </Typography>
                </li>
              )}
              <li className={clsx(css["flex"], styles["list-item"])}>
                <CalendarIcon />
                <Typography
                  as={"time"}
                  className={css["t-minor"]}
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
                  css["flex-col"],
                  styles["connections-container"]
                )}
              >
                <Title>Connections</Title>
                <Connections
                  connections={profile.connections}
                  is_inside_sidebar={is_inside_sidebar}
                />
              </div>
            )}
          </>
        )}
      </div>
      {!is_inside_sidebar && <Spacer orientation={"vertical"} size={3} />}
      {(is_private || is_suspended || Boolean(profile.is_blocked_by_user)) &&
      !is_inside_sidebar ? (
        <Divider
          style={{ width: "auto", marginInline: "var(--grid-compensation)" }}
        />
      ) : null}
    </>
  );
};

export default ProfileContent;
