import { StoryCategory } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/divider";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Skeleton from "~/components/skeleton";
import Typography from "~/components/typography";
import TagChip from "~/entities/tag-chip";
import { use_default_fetch } from "~/hooks/use-default-fetch";
import { use_media_query } from "~/hooks/use-media-query";
import ChevronIcon from "~/icons/chevron";
import { use_get_explore_tags_query } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import TagSkeleton from "./skeleton";
import styles from "./tags.module.scss";

interface Props {
  category: StoryCategory | "all";
  debounced_query: string;
  loading: boolean;
  normalized_category: string;
}

const TagsPreview = ({
  category,
  loading: loading_prop,
  debounced_query,
  normalized_category
}: Props): React.ReactElement | null => {
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [
    trigger,
    {
      data: { items = [] } = {},
      isLoading: is_loading,
      isFetching: is_fetching,
      isError: is_error
    }
  ] = use_get_explore_tags_query();
  use_default_fetch(
    trigger,
    {
      page: 1,
      category,
      query: debounced_query
    },
    [category, debounced_query]
  );
  const loading = is_loading || loading_prop;

  if (is_error || (!items.length && !is_fetching)) {
    return null;
  }

  return (
    <>
      <div
        aria-busy={loading}
        className={clsx(
          css["flex-col"],
          styles.tags,
          loading && styles.loading
        )}
      >
        <Typography level={"body2"} weight={"medium"}>
          Popular tags in {normalized_category}
        </Typography>
        <div
          className={clsx(css["flex"], styles["tags-list"])}
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
          <div className={css["flex"]}>
            <Grow />
            <Skeleton height={12} width={48} />
          </div>
        ) : (
          <Link
            className={clsx(
              css["fit-w"],
              css["t-bold"],
              css["flex-center"],
              styles.x,
              styles["show-more"]
            )}
            href={`/explore/${category === "all" ? "" : category}?tab=tags`}
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
