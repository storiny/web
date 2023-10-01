"use client";

import { StoryCategory } from "@storiny/shared";
import { User } from "@storiny/types";
import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "~/components/avatar";
import Divider from "~/components/divider";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Skeleton from "~/components/skeleton";
import Typography from "~/components/typography";
import ChevronIcon from "~/icons/chevron";
import { use_get_explore_writers_query } from "~/redux/features";
import { abbreviate_number } from "~/utils/abbreviate-number";

import WriterSkeleton from "./skeleton";
import styles from "./writers.module.scss";

interface Props {
  category: StoryCategory | "all";
  debounced_query: string;
  loading: boolean;
  normalized_category: string;
}

// Writer

const Writer = ({ writer }: { writer: User }): React.ReactElement => (
  <NextLink
    className={clsx("flex-col", "flex-center", styles.x, styles.writer)}
    href={`/${writer.username}`}
  >
    <Avatar
      alt={""}
      avatar_id={writer.avatar_id}
      hex={writer.avatar_hex}
      label={writer.name}
      size={"lg"}
    />
    <Typography className={clsx("t-bold", "flex-col", "flex-center")}>
      <span className={"ellipsis"}>{writer.name}</span>
      <Typography
        className={clsx("t-medium", "t-minor")}
        ellipsis
        level={"body2"}
      >
        {abbreviate_number(writer.follower_count)}{" "}
        {writer.follower_count === 1 ? "follower" : "followers"}
      </Typography>
    </Typography>
  </NextLink>
);

const WritersPreview = ({
  category,
  normalized_category,
  loading: loading_prop,
  debounced_query
}: Props): React.ReactElement | null => {
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error
  } = use_get_explore_writers_query({
    page: 1,
    category,
    query: debounced_query
  });
  const { items = [] } = data || {};
  const loading = is_loading || loading_prop;

  if (is_error || (!items.length && !is_fetching)) {
    return null;
  }

  return (
    <>
      <div
        aria-busy={loading}
        className={clsx("flex-col", styles.writers, loading && styles.loading)}
      >
        <Typography className={"t-medium"} level={"body2"}>
          Popular writers in {normalized_category}
        </Typography>
        <div
          className={clsx("flex-center", styles["writers-list"])}
          key={String(loading)}
        >
          {loading
            ? [...Array(5)].map((_, index) => <WriterSkeleton key={index} />)
            : items.map((writer) => <Writer key={writer.id} writer={writer} />)}
        </div>
        {loading ? (
          <div className={"flex"}>
            <Grow />
            <Skeleton height={12} width={48} />
          </div>
        ) : (
          <Link
            className={clsx(
              "fit-w",
              "t-bold",
              "flex-center",
              styles.x,
              styles["show-more"]
            )}
            href={"#"}
            level={"body3"}
          >
            Show more
            <ChevronIcon
              rotation={90}
              style={{ "--icon-size": "12px" } as React.CSSProperties}
            />
          </Link>
        )}
      </div>
      <Divider style={{ marginInline: "var(--grid-compensation)" }} />
    </>
  );
};

export default WritersPreview;
