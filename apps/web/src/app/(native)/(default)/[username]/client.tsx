"use client";

import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { GetProfileResponse } from "~/common/grpc";
import Button from "~/components/button";
import Divider from "~/components/divider";
import Image from "~/components/image";
import Input from "~/components/input";
import Link from "~/components/link";
import Option from "~/components/option";
import Select from "~/components/select";
import Tab from "~/components/tab";
import TabPanel from "~/components/tab-panel";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import { use_media_query } from "~/hooks/use-media-query";
import BanIcon from "~/icons/ban";
import ForbidIcon from "~/icons/forbid";
import LockIcon from "~/icons/lock";
import SearchIcon from "~/icons/search";
import { use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";

import ProfileContent from "./content";
import styles from "./styles.module.scss";
import EntitiesTab from "./tabs/entities";
import StoriesTab from "./tabs/stories";

const CustomState = dynamic(() => import("~/entities/custom-state"), {
  loading: dynamic_loader()
});

export type ProfileTabValue = "stories" | "followers" | "following" | "friends";
export type ProfileEntitySortValue = "popular" | "recent" | "old";

interface Props {
  is_private: boolean;
  is_suspended: boolean;
  profile: GetProfileResponse;
}

// Page header tabs

const TabsHeader = ({
  has_banner,
  hide_following,
  hide_friends
}: {
  has_banner: boolean;
  hide_following: boolean;
  hide_friends: boolean;
}): React.ReactElement => (
  <div
    className={clsx(
      css["full-bleed"],
      css["page-header"],
      styles.tabs,
      has_banner && styles["has-banner"]
    )}
  >
    <TabsList className={clsx(css["full-w"], styles.x, styles["tabs-list"])}>
      <Tab aria-controls={undefined} value={"stories"}>
        Stories
      </Tab>
      <Tab aria-controls={undefined} value={"followers"}>
        Followers
      </Tab>
      {!hide_following && (
        <Tab aria-controls={undefined} value={"following"}>
          Following
        </Tab>
      )}
      {!hide_friends && (
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
  on_sort_change,
  on_query_change,
  disabled,
  placeholder
}: {
  disabled?: boolean;
  on_query_change: (next_query: string) => void;
  on_sort_change: (next_sort: ProfileEntitySortValue) => void;
  placeholder: string;
  query: string;
  sort: ProfileEntitySortValue;
}): React.ReactElement => (
  <div
    className={clsx(
      css["flex-center"],
      css["full-bleed"],
      css["page-header"],
      css["with-page-title"],
      styles["page-header"]
    )}
    style={{ marginTop: 0 }}
  >
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => on_query_change(event.target.value)}
      placeholder={placeholder}
      size={"lg"}
      type={"search"}
      value={query}
    />
    <Divider orientation={"vertical"} />
    <Select
      disabled={disabled}
      onValueChange={on_sort_change}
      slot_props={{
        trigger: {
          "aria-label": "Sort items"
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
  is_suspended,
  is_private
}: Props): React.ReactElement => {
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const first_render_ref = React.useRef<boolean>(true);
  const [tab, set_tab] = React.useState<ProfileTabValue>("stories");
  const [sort, set_sort] = React.useState<ProfileEntitySortValue>(
    tab === "stories" ? "recent" : "popular"
  );
  const [query, set_query] = React.useState<string>("");
  // Hide the content initially when the target user is being blocked
  const [content_hidden, set_content_hidden] = React.useState<boolean>(
    Boolean(profile.is_blocked)
  );
  const has_banner = Boolean(profile.banner_id);
  const is_blocked = use_app_selector(
    (state) => state.entities.blocks[profile.id]
  );

  const handle_query_change = React.useCallback(
    (next_query: string) => set_query(next_query),
    []
  );

  const handle_sort_change = React.useCallback(
    (next_sort: ProfileEntitySortValue) => set_sort(next_sort),
    []
  );

  React.useEffect(() => {
    // `is_blocked` is false on first render due to `use_app_selector`
    if (!is_blocked && !first_render_ref.current) {
      set_content_hidden(false);
    } else {
      first_render_ref.current = false;
    }
  }, [is_blocked]);

  return (
    <>
      {!is_private &&
      !is_suspended &&
      !profile.is_blocked_by_user &&
      has_banner ? (
        <>
          <div className={clsx(css["grid"], styles["banner-wrapper"])}>
            <Image
              alt={""}
              className={clsx(styles.x, styles.banner)}
              hex={profile.banner_hex}
              img_key={profile.banner_id}
              size={ImageSize.W_1200}
              slot_props={{
                image: {
                  sizes: [
                    `${BREAKPOINTS.up("tablet")} calc(100vw - 360px)`,
                    `${BREAKPOINTS.up("mobile")} calc(100vw - 72px)`,
                    "100vw"
                  ].join(","),
                  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
                  srcSet: [
                    `${get_cdn_url(profile.banner_id, ImageSize.W_1920)} 1920w`,
                    `${get_cdn_url(profile.banner_id, ImageSize.W_1440)} 1440w`,
                    `${get_cdn_url(profile.banner_id, ImageSize.W_1200)} 1200w`,
                    `${get_cdn_url(profile.banner_id, ImageSize.W_960)} 960w`,
                    `${get_cdn_url(profile.banner_id, ImageSize.W_640)} 640w`,
                    `${get_cdn_url(profile.banner_id, ImageSize.W_320)} 320w`
                  ].join(",")
                }
              }}
            />
            {/* Adds an elevation to the right sidebar */}
            <div aria-hidden className={styles["right-sidebar-shadow"]} />
          </div>
          <div aria-hidden className={styles["banner-spacer"]} />
        </>
      ) : null}
      {is_smaller_than_tablet && (
        <ProfileContent
          is_private={is_private}
          is_suspended={is_suspended}
          profile={profile}
        />
      )}
      {is_private ||
      is_suspended ||
      Boolean(profile.is_blocked_by_user) ||
      (is_blocked && content_hidden) ? (
        <div className={clsx(css["flex-col"], css["full-w"])}>
          <CustomState
            auto_size
            description={
              is_suspended ? (
                <>
                  This account has been suspended for violating Storiny’s{" "}
                  <Link href={"/guidelines"} underline={"always"}>
                    Community Guidelines
                  </Link>
                  .
                </>
              ) : profile.is_blocked_by_user ? (
                <>
                  You cannot follow{" "}
                  <span className={css["t-medium"]}>@{profile.username}</span>{" "}
                  or interact with their account.{" "}
                  <Link
                    href={"/docs/block"}
                    target={"_blank"}
                    underline={"always"}
                  >
                    Learn more
                  </Link>
                </>
              ) : is_blocked ? (
                <>
                  Would you like to view content from{" "}
                  <span className={css["t-medium"]}>@{profile.username}</span>?
                  Viewing the content will not unblock this user.
                </>
              ) : (
                <>
                  To access the profile and content of{" "}
                  <span className={css["t-medium"]}>@{profile.username}</span>,
                  you need to be in their friends list.
                </>
              )
            }
            icon={
              is_suspended ? (
                <ForbidIcon />
              ) : Boolean(profile.is_blocked_by_user) || is_blocked ? (
                <BanIcon />
              ) : (
                <LockIcon />
              )
            }
            title={
              is_suspended
                ? "Account suspended"
                : profile.is_blocked_by_user
                  ? "This user has blocked you"
                  : is_blocked
                    ? "You have blocked this user"
                    : "This account is private"
            }
          />
          {content_hidden && (
            <div className={clsx(css["full-w"], css["flex-center"])}>
              <Button onClick={(): void => set_content_hidden(false)}>
                View content
              </Button>
            </div>
          )}
        </div>
      ) : content_hidden ? null : (
        <Tabs
          onValueChange={(next_value): void => {
            set_query(""); // Reset search input
            set_tab(next_value as ProfileTabValue);
          }}
          value={tab}
        >
          <TabsHeader
            has_banner={has_banner}
            hide_following={
              typeof profile.following_count !== "number" && !profile.is_self
            }
            hide_friends={
              typeof profile.friend_count !== "number" && !profile.is_self
            }
          />
          <PageHeader
            on_query_change={handle_query_change}
            on_sort_change={handle_sort_change}
            placeholder={`Search ${profile.name}'s ${tab}`}
            query={query}
            sort={sort}
          />
          <TabPanel value={"stories"}>
            <StoriesTab
              query={query}
              sort={sort}
              user_id={profile.id}
              username={profile.username}
            />
          </TabPanel>
          <TabPanel value={"followers"}>
            <EntitiesTab
              entity_type={"followers"}
              query={query}
              sort={sort}
              user_id={profile.id}
              username={profile.username}
            />
          </TabPanel>
          {typeof profile.following_count !== "number" &&
          !profile.is_self ? null : (
            <TabPanel value={"following"}>
              <EntitiesTab
                entity_type={"following"}
                query={query}
                sort={sort}
                user_id={profile.id}
                username={profile.username}
              />
            </TabPanel>
          )}
          {typeof profile.friend_count !== "number" &&
          !profile.is_self ? null : (
            <TabPanel value={"friends"}>
              <EntitiesTab
                entity_type={"friends"}
                query={query}
                sort={sort}
                user_id={profile.id}
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
