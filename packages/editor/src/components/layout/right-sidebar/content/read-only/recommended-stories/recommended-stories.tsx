"use client";

import { Story } from "@storiny/types";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import Link from "~/components/Link";
import Typography from "~/components/Typography";
import ErrorState from "~/entities/ErrorState";
import Persona from "~/entities/Persona";
import {
  getQueryErrorType,
  useGetStoryRecommendationsQuery
} from "~/redux/features";
import { DateFormat, formatDate } from "~/utils/formatDate";

import { storyMetadataAtom } from "../../../../../../atoms";
import styles from "./recommended-stories.module.scss";
import RecommendedStorySkeleton from "./skeleton";

const RecommendedStoriesEmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

// Recommended story item

const RecommendedStory = ({ story }: { story: Story }): React.ReactElement => {
  const { title, slug, user } = story;
  return (
    <article className={clsx("flex-col", styles["recommended-story"])}>
      <Typography as={"h2"} level={"h6"}>
        <Link fixedColor href={`/${user?.username}/${slug}`}>
          {title}
        </Link>
      </Typography>
      <Persona
        avatar={{
          alt: `${user?.name}'s avatar`,
          avatarId: user?.avatar_id,
          label: user?.name,
          hex: user?.avatar_hex
        }}
        primaryText={
          <span className={clsx("flex-center", styles["primary-text"])}>
            <Link
              className={clsx("t-medium")}
              fixedColor
              href={`/${user?.username}`}
              level={"body2"}
            >
              {user?.name}
            </Link>
            <Typography
              aria-hidden
              as={"span"}
              className={"t-muted"}
              level={"body2"}
            >
              &bull;
            </Typography>
            <Typography
              as={"time"}
              className={clsx("t-minor", "t-medium")}
              dateTime={story.published_at!}
              level={"body2"}
              title={formatDate(story.published_at!)}
            >
              {formatDate(story.published_at!, DateFormat.RELATIVE_CAPITALIZED)}
            </Typography>
          </span>
        }
        size={"sm"}
      />
    </article>
  );
};

const RecommendedStories = (): React.ReactElement => {
  const story = useAtomValue(storyMetadataAtom);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetStoryRecommendationsQuery({ storyId: story.id, page: 1 });
  const { items = [] } = data || {};

  return isError ? (
    <ErrorState
      componentProps={{
        button: {
          loading: isFetching
        }
      }}
      retry={refetch}
      size={"sm"}
      type={getQueryErrorType(error)}
    />
  ) : (
    <>
      <Typography
        as={"span"}
        className={clsx("t-minor", "t-bold")}
        level={"body2"}
      >
        Continue reading
      </Typography>
      <div className={clsx("flex-col", styles["recommended-stories"])}>
        {isLoading ? (
          [...Array(5)].map((_, index) => (
            <RecommendedStorySkeleton key={index} />
          ))
        ) : items.length === 0 ? (
          <RecommendedStoriesEmptyState />
        ) : (
          items
            .slice(0, 5)
            .map((story) => <RecommendedStory key={story.id} story={story} />)
        )}
      </div>
    </>
  );
};

export default RecommendedStories;
