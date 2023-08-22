import { StoryCategory } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/Divider";
import Grow from "~/components/Grow";
import Link from "~/components/Link";
import Skeleton from "~/components/Skeleton";
import Typography from "~/components/Typography";
import TagChip from "~/entities/TagChip";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import ChevronIcon from "~/icons/Chevron";
import { useGetExploreTagsQuery } from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

import TagSkeleton from "./skeleton";
import styles from "./tags.module.scss";

interface Props {
  category: StoryCategory | "all";
  debouncedQuery: string;
  loading: boolean;
  normalizedCategory: string;
}

const TagsPreview = ({
  category,
  loading: loadingProp,
  debouncedQuery,
  normalizedCategory
}: Props): React.ReactElement | null => {
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const { data, isLoading, isFetching, isError } = useGetExploreTagsQuery({
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
          styles.tags,
          loading && styles.loading
        )}
      >
        <Typography className={"t-medium"} level={"body2"}>
          Popular tags in {normalizedCategory}
        </Typography>
        <div
          className={clsx("flex", styles.x, styles["tags-list"])}
          key={String(loading)}
        >
          {loading
            ? [...Array(12)].map((_, index) => <TagSkeleton key={index} />)
            : items
                .slice(0, 12)
                .map((tag) => (
                  <TagChip
                    className={clsx(styles.x, styles.tag)}
                    followerCount={tag.follower_count}
                    key={tag.id}
                    size={isMobile ? "lg" : "md"}
                    storyCount={tag.story_count}
                    value={tag.name}
                    withDecorator
                  />
                ))}
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

export default TagsPreview;
