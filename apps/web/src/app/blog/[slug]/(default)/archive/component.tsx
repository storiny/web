"use client";

import { clsx } from "clsx";
import { useSearchParams as use_search_params } from "next/dist/client/components/navigation";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { GetBlogArchiveResponse } from "~/common/grpc";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import {
  get_query_error_type,
  use_get_blog_archive_query
} from "~/redux/features";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import { use_blog_context } from "../../../context";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

interface Props {
  archive: GetBlogArchiveResponse;
}

/**
 * Parses and returns the valid year
 * @param value The year value
 */
export const get_valid_year = (value = ""): number | undefined => {
  const year = Number.parseInt(value);

  if (year > 1000 && year < 5000) {
    return year;
  }

  return undefined;
};

/**
 * Parses and returns the valid month
 * @param value The month value
 */
export const get_valid_month = (value = ""): number | undefined => {
  const month = Number.parseInt(value);

  if (month > 0 && month <= 12) {
    return month;
  }

  return undefined;
};

const Page = ({ archive }: Props): React.ReactElement => {
  const blog = use_blog_context();
  const search_params = use_search_params();
  const [page, set_page] = React.useState<number>(1);
  const year = React.useMemo(
    () => get_valid_year(search_params.get("year") || ""),
    [search_params]
  );
  const month = React.useMemo(
    () => get_valid_month(search_params.get("month") || ""),
    [search_params]
  );

  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_blog_archive_query({
    page,
    blog_id: blog.id,
    year,
    month
  });
  const { items = [], has_more } = data || {};

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  React.useEffect(() => {
    set_page(1);
  }, [year, month]);

  return (
    <>
      {archive.story_count !== 0 && (
        <div
          className={clsx(
            css["full-bleed"],
            css["flex-center"],
            styles["status-header"]
          )}
        >
          <Typography level={"body2"}>
            A total of {abbreviate_number(archive.story_count)}{" "}
            {archive.story_count === 1 ? "story is" : "stories are"} published
            on this blog.
          </Typography>
        </div>
      )}
      {is_error ? (
        <ErrorState
          auto_size
          component_props={{
            button: { loading: is_fetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !is_fetching && !items.length ? (
        <EmptyState />
      ) : is_loading || (is_fetching && page === 1) ? (
        <StoryListSkeleton />
      ) : (
        <VirtualizedStoryList
          has_more={Boolean(has_more)}
          load_more={load_more}
          stories={items}
        />
      )}
    </>
  );
};

export default Page;
