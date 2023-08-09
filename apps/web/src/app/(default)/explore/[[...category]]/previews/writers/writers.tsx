"use client";

import { StoryCategory } from "@storiny/shared";
import { User } from "@storiny/types";
import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "~/components/Avatar";
import Divider from "~/components/Divider";
import Grow from "~/components/Grow";
import Link from "~/components/Link";
import Skeleton from "~/components/Skeleton";
import Typography from "~/components/Typography";
import ChevronIcon from "~/icons/Chevron";
import { useGetExploreWritersQuery } from "~/redux/features";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import WriterSkeleton from "./skeleton";
import styles from "./writers.module.scss";

interface Props {
  category: StoryCategory | "all";
  debouncedQuery: string;
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
      avatarId={writer.avatar_id}
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
        {abbreviateNumber(writer.follower_count)}{" "}
        {writer.follower_count === 1 ? "follower" : "followers"}
      </Typography>
    </Typography>
  </NextLink>
);

const WritersPreview = ({
  category,
  normalizedCategory,
  loading: loadingProp,
  debouncedQuery
}: Props): React.ReactElement | null => {
  const { data, isLoading, isFetching, isError } = useGetExploreWritersQuery({
    page: 1,
    category,
    query: debouncedQuery
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
