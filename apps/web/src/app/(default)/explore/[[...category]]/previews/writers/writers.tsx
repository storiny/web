"use client";

import { StoryCategory } from "@storiny/shared";
import { User } from "@storiny/types";
import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "../../../../../../../../../packages/ui/src/components/avatar";
import Divider from "../../../../../../../../../packages/ui/src/components/divider";
import Grow from "../../../../../../../../../packages/ui/src/components/grow";
import Link from "../../../../../../../../../packages/ui/src/components/link";
import Skeleton from "../../../../../../../../../packages/ui/src/components/skeleton";
import Typography from "../../../../../../../../../packages/ui/src/components/typography";
import ChevronIcon from "~/icons/Chevron";
import { use_get_explore_writers_query } from "~/redux/features";
import { abbreviate_number } from "../../../../../../../../../packages/ui/src/utils/abbreviate-number";

import WriterSkeleton from "./skeleton";
import styles from "./writers.module.scss";

interface Props {
  category: StoryCategory | "all";
  debounced_query: string;
  loading: boolean;
  normalizedCategory: string;
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
  normalizedCategory,
  loading: loadingProp,
  debounced_query
}: Props): React.ReactElement | null => {
  const { data, isLoading, isFetching, isError } =
    use_get_explore_writers_query({
      page: 1,
      category,
      query: debounced_query
    });
  const { items = [] } = data || {};
  const loading = isLoading || loadingProp;

  if (isError || (!items.length && !isFetching)) {
    return null;
  }

  return (
    <>
      <div
        aria-busy={loading}
        className={clsx(
          "flex-col",
          styles.x,
          styles.writers,
          loading && styles.loading
        )}
      >
        <Typography className={"t-medium"} level={"body2"}>
          Popular writers in {normalizedCategory}
        </Typography>
        <div
          className={clsx("flex-center", styles.x, styles["writers-list"])}
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
