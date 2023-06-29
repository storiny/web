import clsx from "clsx";
import React from "react";

import Link from "~/components/Link";
import Separator from "~/components/Separator";
import Skeleton from "~/components/Skeleton";
import Typography, { TypographyProps } from "~/components/Typography";
import ErrorState from "~/entities/ErrorState";
import Tag from "~/entities/Tag";
import ChevronIcon from "~/icons/Chevron";
import StoriesIcon from "~/icons/Stories";
import TagsIcon from "~/icons/Tags";
import UsersIcon from "~/icons/Users";
import PopularStory, {
  PopularStorySkeleton,
} from "~/layout/RightSidebar/PopularStory";
import UserWithAction, {
  UserWithActionSkeleton,
} from "~/layout/RightSidebar/UserWithAction";
import {
  getQueryErrorType,
  useGetRightSidebarContentQuery,
} from "~/redux/features";

import styles from "./DefaultContent.module.scss";

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

const RightSidebarDefaultContent = (): React.ReactElement => {
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetRightSidebarContentQuery();

  return isError ? (
    <ErrorState
      componentProps={{
        button: {
          loading: isFetching,
        },
      }}
      retry={refetch}
      size={"sm"}
      type={getQueryErrorType(error)}
    />
  ) : (
    <>
      <TitleWithIcon icon={<StoriesIcon />}>Popular stories</TitleWithIcon>
      <div className={clsx("flex-col", styles["popular-stories"])}>
        {isLoading
          ? [...Array(3)].map((_, index) => (
              <PopularStorySkeleton key={index} />
            ))
          : data?.stories.map((story) => (
              <PopularStory key={story.id} story={story} />
            ))}
      </div>
      <Separator />
      <TitleWithIcon icon={<UsersIcon />}>Who to follow</TitleWithIcon>
      {isLoading
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
        {isLoading
          ? [...Array(8)].map((_, index) => (
              <Skeleton height={28} key={index} />
            ))
          : data?.tags.map((tag) => (
              <Tag
                followerCount={tag.follower_count}
                key={tag.id}
                size={"lg"}
                storyCount={tag.story_count}
                value={tag.name}
                withDecorator
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
