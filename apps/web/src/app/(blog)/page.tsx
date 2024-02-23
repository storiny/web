"use client";

import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import { useSearchParams as use_search_params } from "next/dist/client/components/navigation";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Divider from "~/components/divider";
import Image from "~/components/image";
import Input from "~/components/input";
import Option from "~/components/option";
import Select from "~/components/select";
import ErrorState from "~/entities/error-state";
import { use_debounce } from "~/hooks/use-debounce";
import SearchIcon from "~/icons/search";
import {
  get_query_error_type,
  use_get_blog_feed_query
} from "~/redux/features";
import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";

import { use_blog_context } from "./context";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

export type BlogFeedSortValue = "recent" | "old";

// Page header

const PageHeader = ({
  query,
  sort,
  on_sort_change,
  on_query_change,
  disabled,
  has_banner
}: {
  disabled?: boolean;
  has_banner: boolean;
  on_query_change: (next_query: string) => void;
  on_sort_change: (next_sort: BlogFeedSortValue) => void;
  query: string;
  sort: BlogFeedSortValue;
}): React.ReactElement => {
  const search_params = use_search_params();

  return (
    <div
      className={clsx(
        css["flex-center"],
        css["full-bleed"],
        css["page-header"],
        css["no-sidenav"],
        styles.header,
        has_banner && styles["has-banner"]
      )}
    >
      <Input
        autoFocus={!!search_params.get("search")}
        decorator={<SearchIcon />}
        disabled={disabled}
        id={"feed-search"}
        onChange={(event): void => on_query_change(event.target.value)}
        placeholder={"Search"}
        size={"lg"}
        type={"search"}
        value={query}
      />
      <Divider orientation={"vertical"} />
      <Select
        disabled={disabled}
        onValueChange={on_sort_change}
        slot_props={{
          trigger: {
            "aria-label": "Sort items"
          },
          value: {
            placeholder: "Sort"
          }
        }}
        value={sort}
      >
        <Option value={"recent"}>Recent</Option>
        <Option value={"old"}>Old</Option>
      </Select>
    </div>
  );
};

const Page = (): React.ReactElement => {
  const blog = use_blog_context();
  const [sort, set_sort] = React.useState<BlogFeedSortValue>("recent");
  const [query, set_query] = React.useState<string>("");
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_blog_feed_query({
    page,
    sort,
    query: debounced_query,
    blog_id: blog.id
  });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;
  const container_ref = React.useRef<HTMLDivElement | null>(null);

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handle_sort_change = React.useCallback(
    (next_sort: BlogFeedSortValue) => {
      set_page(1);
      set_sort(next_sort);
    },
    []
  );

  const handle_query_change = React.useCallback((next_query: string) => {
    set_page(1);
    set_query(next_query);
  }, []);

  React.useEffect(() => {
    const navbar = document.querySelector("[data-global-header='true']");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (navbar) {
          navbar.toggleAttribute("data-detached", !entry.isIntersecting);
        }
      },
      {
        rootMargin: "-50px 0px -100% 0px",
        threshold: 0
      }
    );

    if (container_ref.current && blog.banner_id) {
      observer.observe(container_ref.current);
    }

    return () => observer.disconnect();
  }, [blog.banner_id]);

  return (
    <>
      {blog.banner_id && (
        <Image
          alt={""}
          aria-hidden={"true"}
          className={styles.banner}
          hex={blog.banner_hex}
          img_key={blog.banner_id}
          slot_props={{
            image: {
              className: styles["banner-img"],
              loading: "eager",
              draggable: false,
              sizes: "100vw",
              // eslint-disable-next-line prefer-snakecase/prefer-snakecase
              srcSet: [
                `${get_cdn_url(blog.banner_id, ImageSize.W_2440)} 2440w`,
                `${get_cdn_url(blog.banner_id, ImageSize.W_1920)} 1920w`,
                `${get_cdn_url(blog.banner_id, ImageSize.W_1440)} 1440w`,
                `${get_cdn_url(blog.banner_id, ImageSize.W_1200)} 1200w`,
                `${get_cdn_url(blog.banner_id, ImageSize.W_960)} 960w`,
                `${get_cdn_url(blog.banner_id, ImageSize.W_640)} 640w`
              ].join(",")
            }
          }}
        />
      )}
      <div className={styles.content} ref={container_ref}>
        <PageHeader
          disabled={!query && !items.length && !is_fetching}
          has_banner={Boolean(blog.banner_id)}
          on_query_change={handle_query_change}
          on_sort_change={handle_sort_change}
          query={query}
          sort={sort}
        />
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
          <EmptyState query={query} />
        ) : is_loading || is_typing || (is_fetching && page === 1) ? (
          <StoryListSkeleton is_large={blog.is_homepage_large_layout} />
        ) : (
          <VirtualizedStoryList
            has_more={Boolean(has_more)}
            load_more={load_more}
            skeleton_props={{
              is_large: blog.is_homepage_large_layout
            }}
            stories={items}
            story_props={{
              is_large: blog.is_homepage_large_layout
            }}
          />
        )}
      </div>
    </>
  );
};

export default Page;
