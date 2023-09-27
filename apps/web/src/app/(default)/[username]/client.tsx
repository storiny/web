"use client";

import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { GetProfileResponse } from "~/common/grpc";
import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Image from "~/components/Image";
import Input from "~/components/Input";
import Link from "~/components/Link";
import Option from "~/components/Option";
import Select from "~/components/Select";
import Tab from "~/components/Tab";
import TabPanel from "~/components/TabPanel";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import BanIcon from "~/icons/Ban";
import ForbidIcon from "~/icons/Forbid";
import LockIcon from "~/icons/Lock";
import SearchIcon from "~/icons/Search";
import { use_app_selector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { getCdnUrl } from "~/utils/getCdnUrl";

import ProfileContent from "./content";
import styles from "./styles.module.scss";
import EntitiesTab from "./tabs/entities";
import StoriesTab from "./tabs/stories";

const CustomState = dynamic(() => import("~/entities/CustomState"), {
  loading: dynamicLoader()
});

export type ProfileTabValue = "stories" | "followers" | "following" | "friends";
export type ProfileEntitySortValue = "popular" | "recent" | "old";

interface Props {
  isPrivate: boolean;
  isSuspended: boolean;
  profile: GetProfileResponse;
}

// Page header tabs

const TabsHeader = ({
  hasBanner,
  hideFollowing,
  hideFriends
}: {
  hasBanner: boolean;
  hideFollowing: boolean;
  hideFriends: boolean;
}): React.ReactElement => (
  <div
    className={clsx(
      "full-bleed",
      "page-header",
      styles.x,
      styles.tabs,
      hasBanner && styles["has-banner"]
    )}
  >
    <TabsList className={clsx("full-w", styles.x, styles["tabs-list"])}>
      <Tab aria-controls={undefined} value={"stories"}>
        Stories
      </Tab>
      <Tab aria-controls={undefined} value={"followers"}>
        Followers
      </Tab>
      {!hideFollowing && (
        <Tab aria-controls={undefined} value={"following"}>
          Following
        </Tab>
      )}
      {!hideFriends && (
        <Tab aria-controls={undefined} value={"friends"}>
          Friends
        </Tab>
      )}
    </TabsList>
  </div>
);

// Page header

const PageHeader = ({
  query,
  sort,
  onSortChange,
  onQueryChange,
  disabled,
  placeholder
}: {
  disabled?: boolean;
  onQueryChange: (newQuery: string) => void;
  onSortChange: (newSort: ProfileEntitySortValue) => void;
  placeholder: string;
  query: string;
  sort: ProfileEntitySortValue;
}): React.ReactElement => (
  <div
    className={clsx(
      "flex-center",
      "full-bleed",
      "page-header",
      "with-page-title",
      styles.x,
      styles["page-header"]
    )}
    style={{ marginTop: 0 }}
  >
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => onQueryChange(event.target.value)}
      placeholder={placeholder}
      size={"lg"}
      slot_props={{
        container: {
          className: clsx("f-grow", styles.x, styles.input)
        }
      }}
      type={"search"}
      value={query}
    />
    <Divider orientation={"vertical"} />
    <Select
      disabled={disabled}
      onValueChange={onSortChange}
      slot_props={{
        trigger: {
          "aria-label": "Sort items",
          className: clsx("focus-invert", styles.x, styles["select-trigger"])
        },
        value: {
          placeholder: "Sort"
        }
      }}
      value={sort}
    >
      <Option value={"recent"}>Recent</Option>
      <Option value={"popular"}>Popular</Option>
      <Option value={"old"}>Old</Option>
    </Select>
  </div>
);

const Page = ({
  profile,
  isSuspended,
  isPrivate
}: Props): React.ReactElement => {
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  const firstRender = React.useRef<boolean>(true);
  const [tab, setTab] = React.useState<ProfileTabValue>("stories");
  const [sort, setSort] = React.useState<ProfileEntitySortValue>(
    tab === "stories" ? "recent" : "popular"
  );
  const [query, setQuery] = React.useState<string>("");
  // Hide the content initially when the target user is being blocked
  const [contentHidden, setContentHidden] = React.useState<boolean>(
    Boolean(profile.is_blocking)
  );
  const hasBanner = Boolean(profile.banner_id);
  const isBlocking = use_app_selector(
    (state) => state.entities.blocks[profile.id]
  );

  const handleQueryChange = React.useCallback(
    (newQuery: string) => setQuery(newQuery),
    []
  );

  const handleSortChange = React.useCallback(
    (newSort: ProfileEntitySortValue) => setSort(newSort),
    []
  );

  React.useEffect(() => {
    // isBlocking is false on first render due to `use_app_selector`
    if (!isBlocking && !firstRender.current) {
      setContentHidden(false);
    } else {
      firstRender.current = false;
    }
  }, [isBlocking]);

  return (
    <>
      {!isPrivate &&
      !isSuspended &&
      !profile.is_blocked_by_user &&
      hasBanner ? (
        <>
          <div className={clsx("grid", styles.x, styles["banner-wrapper"])}>
            <Image
              alt={""}
              className={clsx(styles.x, styles.banner)}
              hex={profile.banner_hex}
              imgId={profile.banner_id}
              slot_props={{
                image: {
                  sizes: [
                    `${breakpoints.up("tablet")} calc(100vw - 360px)`,
                    `${breakpoints.up("mobile")} calc(100vw - 72px)`,
                    "100vw"
                  ].join(","),
                  srcSet: [
                    `${getCdnUrl(profile.banner_id, ImageSize.W_2048)} 2048w`,
                    `${getCdnUrl(profile.banner_id, ImageSize.W_1920)} 1920w`,
                    `${getCdnUrl(profile.banner_id, ImageSize.W_1440)} 1440w`,
                    `${getCdnUrl(profile.banner_id, ImageSize.W_1024)} 1024w`,
                    `${getCdnUrl(profile.banner_id, ImageSize.W_860)} 860w`,
                    `${getCdnUrl(profile.banner_id, ImageSize.W_640)} 640w`,
                    `${getCdnUrl(profile.banner_id, ImageSize.W_320)} 320w`
                  ].join(",")
                }
              }}
            />
            {/* Adds an elevation to the right sidebar */}
            <div
              aria-hidden
              className={clsx(styles.x, styles["right-sidebar-shadow"])}
            />
          </div>
          <div
            aria-hidden
            className={clsx(styles.x, styles["banner-spacer"])}
          />
        </>
      ) : null}
      {isSmallerThanTablet && (
        <ProfileContent
          isPrivate={isPrivate}
          isSuspended={isSuspended}
          profile={profile}
        />
      )}
      {isPrivate ||
      isSuspended ||
      Boolean(profile.is_blocked_by_user) ||
      (isBlocking && contentHidden) ? (
        <div className={clsx("flex-col", "full-w")}>
          <CustomState
            autoSize
            description={
              isSuspended ? (
                <>
                  This account has been suspended for violating Storiny’s{" "}
                  <Link href={"/guidelines"} underline={"always"}>
                    Community Guidelines
                  </Link>
                  .
                </>
              ) : profile.is_blocked_by_user ? (
                <>
                  There is no way for you to follow{" "}
                  <span className={"t-medium"}>@{profile.username}</span> or
                  interact with their account.{" "}
                  <Link
                    href={"/docs/block"}
                    target={"_blank"}
                    underline={"always"}
                  >
                    Learn more
                  </Link>
                </>
              ) : isBlocking ? (
                <>
                  Would you like to view content from{" "}
                  <span className={"t-medium"}>@{profile.username}</span>?
                  Viewing the content will not unblock this user.
                </>
              ) : (
                <>
                  To access the profile and content of{" "}
                  <span className={"t-medium"}>@{profile.username}</span>, you
                  need to be in their friends list.
                </>
              )
            }
            icon={
              isSuspended ? (
                <ForbidIcon />
              ) : Boolean(profile.is_blocked_by_user) || isBlocking ? (
                <BanIcon />
              ) : (
                <LockIcon />
              )
            }
            title={
              isSuspended
                ? "Account suspended"
                : profile.is_blocked_by_user
                ? "This user has blocked you"
                : isBlocking
                ? "You have blocked this user"
                : "This account is private"
            }
          />
          {contentHidden && (
            <div className={clsx("full-w", "flex-center")}>
              <Button onClick={(): void => setContentHidden(false)}>
                View content
              </Button>
            </div>
          )}
        </div>
      ) : contentHidden ? null : (
        <Tabs
          onValueChange={(newValue): void => {
            setQuery(""); // Reset search input
            setTab(newValue as ProfileTabValue);
          }}
          value={tab}
        >
          <TabsHeader
            hasBanner={hasBanner}
            hideFollowing={
              typeof profile.following_count !== "number" && !profile.is_self
            }
            hideFriends={
              typeof profile.friend_count !== "number" && !profile.is_self
            }
          />
          <PageHeader
            onQueryChange={handleQueryChange}
            onSortChange={handleSortChange}
            placeholder={`Search ${profile.name}'s ${tab}`}
            query={query}
            sort={sort}
          />
          <TabPanel value={"stories"}>
            <StoriesTab
              query={query}
              sort={sort}
              userId={profile.id}
              username={profile.username}
            />
          </TabPanel>
          <TabPanel value={"followers"}>
            <EntitiesTab
              entityType={"followers"}
              query={query}
              sort={sort}
              userId={profile.id}
              username={profile.username}
            />
          </TabPanel>
          {typeof profile.following_count !== "number" &&
          !profile.is_self ? null : (
            <TabPanel value={"following"}>
              <EntitiesTab
                entityType={"following"}
                query={query}
                sort={sort}
                userId={profile.id}
                username={profile.username}
              />
            </TabPanel>
          )}
          {typeof profile.friend_count !== "number" &&
          !profile.is_self ? null : (
            <TabPanel value={"friends"}>
              <EntitiesTab
                entityType={"friends"}
                query={query}
                sort={sort}
                userId={profile.id}
                username={profile.username}
              />
            </TabPanel>
          )}
        </Tabs>
      )}
    </>
  );
};

export default Page;
