import { Blog } from "@storiny/types";
import { clsx } from "clsx";
import { Provider, useAtom as use_atom } from "jotai";
import {
  atom,
  useAtomValue as use_atom_value,
  useSetAtom as use_set_atom
} from "jotai/index";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import { Root, Scrollbar, Thumb, Viewport } from "~/components/scroll-area";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import CustomState from "~/entities/custom-state";
import ErrorState from "~/entities/error-state";
import { use_default_fetch } from "~/hooks/use-default-fetch";
import { use_pagination } from "~/hooks/use-pagination";
import {
  get_query_error_type,
  select_blogs,
  use_get_blogs_query
} from "~/redux/features";

import { story_metadata_atom } from "../../../../../atoms";
import styles from "./blog.module.scss";
import BlogList from "./list";
import { selected_blog_atom } from "./selected-blog";

const render_key_atom = atom<string>(""); // Key to re-render the scrollbar

// Scroller

const Scroller = React.memo(
  React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
    ({ children, ...rest }, ref) => {
      const render_key = use_atom_value(render_key_atom);
      return (
        <>
          <Viewport {...rest} ref={ref} tabIndex={-1}>
            {children}
          </Viewport>
          <Scrollbar key={render_key} orientation="vertical">
            <Thumb />
          </Scrollbar>
        </>
      );
    }
  )
);

Scroller.displayName = "Scroller";

// Blog list

const List = (): React.ReactElement => {
  const set_render_key = use_set_atom(render_key_atom);
  const page = use_pagination(select_blogs({ page: 1 }));
  const [
    trigger,
    {
      data: { items = [], has_more } = {},
      isLoading: is_loading,
      isFetching: is_fetching,
      isError: is_error,
      error
    }
  ] = use_get_blogs_query();
  const refetch = use_default_fetch(trigger, { page });

  const load_more = React.useCallback(() => {
    trigger({ page: page + 1 }, true);
  }, [page, trigger]);

  React.useEffect(() => {
    set_render_key(`${page}`);
  }, [page, set_render_key]);

  return is_loading || (is_fetching && page === 1) ? (
    <SuspenseLoader />
  ) : is_error ? (
    <ErrorState
      component_props={{
        button: { loading: is_fetching }
      }}
      retry={refetch}
      size={"sm"}
      type={get_query_error_type(error)}
    />
  ) : !is_fetching && !items.length ? (
    <CustomState
      description={"You are not a member of any blog."}
      size={"sm"}
      title={"No blogs"}
    />
  ) : (
    <BlogList
      blogs={items}
      components={{ Scroller }}
      has_more={Boolean(has_more)}
      load_more={load_more}
    />
  );
};

const BlogTabImpl = (): React.ReactElement => {
  const story = use_atom_value(story_metadata_atom);
  const [selected_blog, set_selected_blog] = use_atom(selected_blog_atom);

  React.useEffect(() => {
    if (typeof selected_blog === "undefined") {
      set_selected_blog((story.blog as Blog) || null);
    }
  }, [selected_blog, set_selected_blog, story.blog]);

  return (
    <React.Fragment>
      <Typography color={"minor"} level={"body2"}>
        Choose a blog where you want to publish this story. If you are not the
        editor or owner of the blog, your story will be reviewed by the
        blog&apos;s editors before being published.
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      <Root className={clsx(styles.x, styles["scroll-area"])} type={"auto"}>
        <List />
      </Root>
    </React.Fragment>
  );
};

const BlogTab = (): React.ReactElement => (
  <Provider>
    <BlogTabImpl />
  </Provider>
);

export default BlogTab;
