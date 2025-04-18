import { clsx } from "clsx";
import {
  atom,
  useAtomValue as use_atom_value,
  useSetAtom as use_set_atom
} from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { VirtualizedFriendRequestList } from "~/common/friend-request";
import SuspenseLoader from "~/common/suspense-loader";
import Button from "~/components/button";
import Divider from "~/components/divider";
import Input from "~/components/input";
import { ModalFooterButton, use_modal } from "~/components/modal";
import Option from "~/components/option";
import { Root, Scrollbar, Thumb, Viewport } from "~/components/scroll-area";
import Select from "~/components/select";
import ErrorState from "~/entities/error-state";
import { use_debounce } from "~/hooks/use-debounce";
import { use_default_fetch } from "~/hooks/use-default-fetch";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import { use_media_query } from "~/hooks/use-media-query";
import { use_pagination } from "~/hooks/use-pagination";
import SearchIcon from "~/icons/search";
import UserHeartIcon from "~/icons/user-heart";
import {
  get_query_error_type,
  select_friend_requests,
  use_get_friend_requests_query
} from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import styles from "./friend-requests.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

export type FriendRequestsSortValue = "popular" | "recent" | "old";

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

const FriendRequestsModal = (): React.ReactElement => {
  const [sort, set_sort] = React.useState<FriendRequestsSortValue>("popular");
  const [query, set_query] = React.useState<string>("");
  use_handle_dynamic_state<typeof query>("", set_query);
  use_handle_dynamic_state<typeof sort>("popular", set_sort);
  const set_render_key = use_set_atom(render_key_atom);
  const debounced_query = use_debounce(query);
  const page = use_pagination(
    select_friend_requests({
      page: 1,
      sort,
      query: debounced_query
    })
  );
  const [
    trigger,
    {
      data: { items = [], has_more } = {},
      isLoading: is_loading,
      isFetching: is_fetching,
      isError: is_error,
      error
    }
  ] = use_get_friend_requests_query();
  const refetch = use_default_fetch(
    trigger,
    {
      page,
      sort,
      query: debounced_query
    },
    [debounced_query, sort]
  );
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(() => {
    trigger(
      {
        page: page + 1,
        sort,
        query: debounced_query
      },
      true
    );
  }, [debounced_query, page, sort, trigger]);

  const handle_sort_change = React.useCallback(
    (next_sort: FriendRequestsSortValue) => {
      set_sort(next_sort);
    },
    []
  );

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
        <Divider orientation={"vertical"} />
        <Select
          disabled={!query && !items.length}
          onValueChange={handle_sort_change}
          slot_props={{
            trigger: {
              "aria-label": "Sort items",
              className: clsx(
                css["focus-invert"],
                styles.x,
                styles["select-trigger"]
              )
            },
            value: {
              placeholder: "Sort"
            },
            content: {
              style: {
                zIndex: "calc(var(--z-index-modal) + 2)"
              }
            }
          }}
          value={sort}
        >
          <Option value={"popular"}>Popular</Option>
          <Option value={"recent"}>Recent</Option>
          <Option value={"old"}>Old</Option>
        </Select>
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
          <VirtualizedFriendRequestList
            components={{ Scroller }}
            friend_requests={items}
            has_more={Boolean(has_more)}
            load_more={load_more}
            useWindowScroll={false}
          />
        </Root>
      )}
    </div>
  );
};

const FriendRequests = (): React.ReactElement => {
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
    <FriendRequestsModal />,
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
          decorator: <UserHeartIcon />,
          children: "Friend requests"
        }
      }
    }
  );

  return element;
};

export default FriendRequests;
