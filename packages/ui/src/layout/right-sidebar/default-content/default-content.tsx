import clsx from "clsx";
import React from "react";

import Link from "~/components/link";
import Separator from "~/components/separator";
import Skeleton from "~/components/skeleton";
import Typography, { TypographyProps } from "~/components/typography";
import ErrorState from "~/entities/error-state";
import TagChip from "~/entities/tag-chip";
import ChevronIcon from "~/icons/chevron";
import StoriesIcon from "~/icons/stories";
import TagsIcon from "~/icons/tags";
import UsersIcon from "~/icons/users";
import PopularStory, {
  PopularStorySkeleton
} from "~/layout/right-sidebar/popular-story";
import UserWithAction, {
  UserWithActionSkeleton
} from "~/layout/right-sidebar/user-with-action";
import {
  get_query_error_type,
  use_get_right_sidebar_content_query
} from "~/redux/features";
import css from "~/theme/main.module.scss";

import styles from "./default-content.module.scss";
import { RightSidebarDefaultContentProps } from "./default-content.props";

export const TitleWithIcon = ({
  icon,
  children,
  className,
  ...rest
}: TypographyProps & { icon: React.ReactNode }): React.ReactElement => (
  <span className={styles["title-with-icon"]}>
    {icon}
    <Typography
      {...rest}
      as={"span"}
      className={clsx(css["t-minor"], css["t-bold"], className)}
      level={"body2"}
    >
      {children}
    </Typography>
  </span>
);

const RightSidebarDefaultContent = ({
  hide_popular_stories
}: RightSidebarDefaultContentProps): React.ReactElement => {
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_right_sidebar_content_query();
  const has_stories = Boolean(data?.stories?.length);
  const has_users = Boolean(data?.users?.length);
  const has_tags = Boolean(data?.tags?.length);
  const is_empty = !is_loading && !has_stories && !has_users && !has_tags;

  return is_error ? (
    <ErrorState
      component_props={{
        button: {
          loading: is_fetching
        }
      }}
      retry={refetch}
      size={"sm"}
      type={get_query_error_type(error)}
    />
  ) : is_empty ? (
    <Typography color={"minor"} level={"body2"}>
      Not enough data to populate your sidebar.
    </Typography>
  ) : (
    <>
      {hide_popular_stories ||
      (!is_loading && !data?.stories?.length) ? null : (
        <>
          <TitleWithIcon icon={<StoriesIcon />}>Popular stories</TitleWithIcon>
          <div className={clsx(css["flex-col"], styles["popular-stories"])}>
            {is_loading
              ? [...Array(3)].map((_, index) => (
                  <PopularStorySkeleton key={index} />
                ))
              : data?.stories.map((story) => (
                  <PopularStory key={story.id} story={story} />
                ))}
          </div>
          {is_loading || has_users || has_tags ? <Separator /> : null}
        </>
      )}
      {!is_loading && !data?.users?.length ? null : (
        <>
          <TitleWithIcon icon={<UsersIcon />}>Who to follow</TitleWithIcon>
          {is_loading
            ? [...Array(5)].map((_, index) => (
                <UserWithActionSkeleton key={index} />
              ))
            : data?.users.map((user) => (
                <UserWithAction key={user.id} user={user} />
              ))}
          {data && (
            <div className={styles["show-more-wrapper"]}>
              <Link
                className={clsx(
                  css["flex-center"],
                  css["t-bold"],
                  styles["show-more"]
                )}
                href={"/explore?tab=users"}
                level={"body3"}
              >
                Show more
                <ChevronIcon rotation={90} />
              </Link>
            </div>
          )}
          {is_loading || has_tags ? <Separator /> : null}
        </>
      )}
      {!is_loading && !data?.tags?.length ? null : (
        <>
          <TitleWithIcon icon={<TagsIcon />}>Popular tags</TitleWithIcon>
          <div className={clsx(css["flex-col"], styles["tags-container"])}>
            {is_loading
              ? [...Array(8)].map((_, index) => (
                  <Skeleton height={28} key={index} />
                ))
              : data?.tags.map((tag) => (
                  <TagChip
                    follower_count={tag.follower_count}
                    key={tag.id}
                    size={"lg"}
                    story_count={tag.story_count}
                    value={tag.name}
                    with_decorator
                  />
                ))}
          </div>
          {data && (
            <div className={styles["show-more-wrapper"]}>
              <Link
                className={clsx(
                  css["flex-center"],
                  css["t-bold"],
                  styles["show-more"]
                )}
                href={"/explore?tab=tags"}
                level={"body3"}
              >
                Show more
                <ChevronIcon rotation={90} />
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default RightSidebarDefaultContent;
