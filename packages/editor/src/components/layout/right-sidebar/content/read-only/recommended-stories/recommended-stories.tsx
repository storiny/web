"use client";

import { Story } from "@storiny/types";
import clsx from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { dynamic_loader } from "~/common/dynamic";
import Link from "~/components/link";
import NoSsr from "~/components/no-ssr";
import Typography from "~/components/typography";
import UserHoverCard from "~/components/user-hover-card";
import ErrorState from "~/entities/error-state";
import Persona from "~/entities/persona";
import {
  get_query_error_type,
  use_get_blog_story_recommendations_query,
  use_get_story_recommendations_query
} from "~/redux/features";
import css from "~/theme/main.module.scss";
import { DateFormat, format_date } from "~/utils/format-date";

import { story_metadata_atom } from "../../../../../../atoms";
import styles from "./recommended-stories.module.scss";
import RecommendedStorySkeleton from "./skeleton";

const RecommendedStoriesEmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

// Recommended story item

const RecommendedStory = ({ story }: { story: Story }): React.ReactElement => {
  const { title, slug, user } = story;
  return (
    <article className={clsx(css["flex-col"], styles["recommended-story"])}>
      <Typography as={"h2"} level={"h6"}>
        <Link fixed_color href={`/${user?.username}/${slug}`}>
          {title}
        </Link>
      </Typography>
      <Persona
        avatar={{
          alt: `${user?.name}'s avatar`,
          avatar_id: user?.avatar_id,
          label: user?.name,
          hex: user?.avatar_hex
        }}
        component_props={{
          primary_text: { style: { minWidth: 0 } }
        }}
        primary_text={
          <span className={clsx(css["flex-center"], styles["primary-text"])}>
            <UserHoverCard identifier={user?.id || ""}>
              <Link
                className={clsx(css["t-medium"], css.ellipsis)}
                fixed_color
                href={`/${user?.username}`}
                level={"body2"}
              >
                {user?.name}
              </Link>
            </UserHoverCard>
            <Typography aria-hidden as={"span"} color={"muted"} level={"body2"}>
              &bull;
            </Typography>
            <NoSsr>
              <Typography
                as={"time"}
                className={css.ellipsis}
                color={"minor"}
                dateTime={story.published_at!}
                level={"body2"}
                title={format_date(story.published_at!)}
                weight={"medium"}
              >
                {format_date(
                  story.published_at!,
                  DateFormat.RELATIVE_CAPITALIZED
                )}
              </Typography>
            </NoSsr>
          </span>
        }
        size={"sm"}
      />
    </article>
  );
};

const BlogRecommendedStories = (): React.ReactElement => {
  const story = use_atom_value(story_metadata_atom);
  const blog = use_blog_context();
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_blog_story_recommendations_query({
    story_id: story.id,
    blog_id: blog.id,
    page: 1
  });
  const { items = [] } = data || {};

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
      <Typography as={"span"} color={"minor"} level={"body2"} weight={"bold"}>
        Continue reading
      </Typography>
      <div className={clsx(css["flex-col"], styles["recommended-stories"])}>
        {is_loading ? (
          [...Array(5)].map((_, index) => (
            <RecommendedStorySkeleton key={index} />
          ))
        ) : !is_fetching && items.length === 0 ? (
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

const DefaultRecommendedStories = (): React.ReactElement => {
  const story = use_atom_value(story_metadata_atom);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_story_recommendations_query({ story_id: story.id, page: 1 });
  const { items = [] } = data || {};

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
      <Typography as={"span"} color={"minor"} level={"body2"} weight={"bold"}>
        Continue reading
      </Typography>
      <div className={clsx(css["flex-col"], styles["recommended-stories"])}>
        {is_loading ? (
          [...Array(5)].map((_, index) => (
            <RecommendedStorySkeleton key={index} />
          ))
        ) : !is_fetching && items.length === 0 ? (
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

const RecommendedStories = (): React.ReactElement => {
  const blog = use_blog_context();
  return blog?.id ? <BlogRecommendedStories /> : <DefaultRecommendedStories />;
};

export default RecommendedStories;
