import clsx from "clsx";
import React from "react";

import Link from "src/components/link";
import Separator from "src/components/separator";
import Skeleton from "src/components/skeleton";
import Typography, { TypographyProps } from "src/components/typography";
import ErrorState from "src/entities/error-state";
import TagChip from "src/entities/tag-chip";
import ChevronIcon from "src/icons/chevron";
import StoriesIcon from "src/icons/stories";
import TagsIcon from "src/icons/tags";
import UsersIcon from "src/icons/users";
import { RightSidebarDefaultContentProps } from "./default-content.props";
import PopularStory, {
  PopularStorySkeleton
} from "src/layout/right-sidebar/popular-story";
import UserWithAction, {
  UserWithActionSkeleton
} from "src/layout/right-sidebar/user-with-action";
import {
  get_query_error_type,
  use_get_right_sidebar_content_query
} from "~/redux/features";

import styles from "./default-content.module.scss";

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
      className={clsx("t-minor", "t-bold", className)}
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
  ) : (
    <>
      {!hide_popular_stories && (
        <>
          <TitleWithIcon icon={<StoriesIcon />}>Popular stories</TitleWithIcon>
          <div className={clsx("flex-col", styles["popular-stories"])}>
            {is_loading
              ? [...Array(3)].map((_, index) => (
                  <PopularStorySkeleton key={index} />
                ))
              : data?.stories.map((story) => (
                  <PopularStory key={story.id} story={story} />
                ))}
          </div>
          <Separator />
        </>
      )}
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
            className={clsx("flex-center", "t-bold", styles["show-more"])}
            href={"/explore/users"}
            level={"body3"}
          >
            Show more
            <ChevronIcon rotation={90} />
          </Link>
        </div>
      )}
      <Separator />
      <TitleWithIcon icon={<TagsIcon />}>Popular tags</TitleWithIcon>
      <div className={clsx("flex-col", styles["tags-container"])}>
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
            className={clsx("flex-center", "t-bold", styles["show-more"])}
            href={"/explore/tags"}
            level={"body3"}
          >
            Show more
            <ChevronIcon rotation={90} />
          </Link>
        </div>
      )}
    </>
  );
};

export default RightSidebarDefaultContent;
