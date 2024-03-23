import { clsx } from "clsx";
import {
  atom,
  useAtomValue as use_atom_value,
  useSetAtom as use_set_atom
} from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { VirtualizedBlogMemberRequestList } from "~/common/blog-member-request";
import { use_blog_context } from "~/common/context/blog";
import { dynamic_loader } from "~/common/dynamic";
import SuspenseLoader from "~/common/suspense-loader";
import Button from "~/components/button";
import Input from "~/components/input";
import { ModalFooterButton, use_modal } from "~/components/modal";
import { Root, Scrollbar, Thumb, Viewport } from "~/components/scroll-area";
import ErrorState from "~/entities/error-state";
import { use_debounce } from "~/hooks/use-debounce";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import { use_media_query } from "~/hooks/use-media-query";
import PencilIcon from "~/icons/pencil";
import SearchIcon from "~/icons/search";
import {
  get_query_error_type,
  use_get_blog_editor_requests_query
} from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import styles from "./editor-requests.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

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

// Modal

const EditorRequestsModal = (): React.ReactElement => {
  const [query, set_query] = React.useState<string>("");
  const [page, set_page] = React.useState<number>(1);
  use_handle_dynamic_state(1, set_page);
  use_handle_dynamic_state("", set_query);
  const set_render_key = use_set_atom(render_key_atom);
  const blog = use_blog_context();
  const debounced_query = use_debounce(query);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_blog_editor_requests_query({
    blog_id: blog.id,
    page,
    query: debounced_query
  });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  React.useEffect(() => {
    set_page(1);
  }, [query]);

  React.useEffect(() => {
    set_render_key(`${page}:${query}`);
  }, [page, query, set_render_key]);

  return (
    <div className={clsx(css["flex-col"], styles.content)}>
      <div className={clsx(css["flex-center"], styles["control-bar"])}>
        <Input
          autoFocus
          decorator={<SearchIcon />}
          disabled={!query && !items.length}
          onChange={(event): void => set_query(event.target.value)}
          placeholder={"Search"}
          slot_props={{
            container: {
              className: clsx(css["f-grow"], styles.x, styles.input)
            }
          }}
          type={"search"}
          value={query}
        />
      </div>
      {is_loading || is_typing || (is_fetching && page === 1) ? (
        <SuspenseLoader />
      ) : is_error ? (
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
      ) : (
        <Root className={clsx(styles.x, styles["scroll-area"])} type={"auto"}>
          <VirtualizedBlogMemberRequestList
            blog_member_request_props={{
              role: "editor"
            }}
            blog_member_requests={items}
            components={{ Scroller }}
            has_more={Boolean(has_more)}
            load_more={load_more}
            useWindowScroll={false}
          />
        </Root>
      )}
    </div>
  );
};

const EditorRequests = (): React.ReactElement => {
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const [element] = use_modal(
    ({ open_modal }) => (
      <Button
        auto_size
        check_auth
        className={css["fit-w"]}
        onClick={open_modal}
        variant={is_smaller_than_desktop ? "hollow" : "rigid"}
      >
        View requests
      </Button>
    ),
    <EditorRequestsModal />,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton compact={is_smaller_than_mobile}>
            Done
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        footer: {
          compact: is_smaller_than_mobile
        },
        body: {
          style: {
            padding: 0
          }
        },
        content: {
          style: {
            width: is_smaller_than_mobile ? "100%" : "480px"
          }
        },
        header: {
          decorator: <PencilIcon />,
          children: "Editor requests"
        }
      }
    }
  );

  return element;
};

export default EditorRequests;
