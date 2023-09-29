import { StoryCategory } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Divider from "../../../../../../../../../packages/ui/src/components/divider";
import Grow from "../../../../../../../../../packages/ui/src/components/grow";
import Link from "../../../../../../../../../packages/ui/src/components/link";
import Skeleton from "../../../../../../../../../packages/ui/src/components/skeleton";
import Typography from "../../../../../../../../../packages/ui/src/components/typography";
import TagChip from "../../../../../../../../../packages/ui/src/entities/tag-chip";
import { use_media_query } from "../../../../../../../../../packages/ui/src/hooks/use-media-query";
import ChevronIcon from "~/icons/Chevron";
import { use_get_explore_tag_query } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";

import TagSkeleton from "./skeleton";
import styles from "./tags.module.scss";

interface Props {
  category: StoryCategory | "all";
  debounced_query: string;
  loading: boolean;
  normalizedCategory: string;
}

const TagsPreview = ({
  category,
  loading: loadingProp,
  debounced_query,
  normalizedCategory
}: Props): React.ReactElement | null => {
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const { data, isLoading, isFetching, isError } = use_get_explore_tag_query({
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
                    follower_count={tag.follower_count}
                    key={tag.id}
                    size={is_mobile ? "lg" : "md"}
                    story_count={tag.story_count}
                    value={tag.name}
                    with_decorator
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
