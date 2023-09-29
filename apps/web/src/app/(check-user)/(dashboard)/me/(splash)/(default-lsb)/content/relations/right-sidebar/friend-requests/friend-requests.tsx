import { clsx } from "clsx";
import { atom, useAtomValue, useSetAtom } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { VirtualizedFriendRequestList } from "~/common/friend-request";
import SuspenseLoader from "~/common/suspense-loader";
import Button from "../../../../../../../../../../../../../packages/ui/src/components/button";
import Divider from "../../../../../../../../../../../../../packages/ui/src/components/divider";
import Input from "../../../../../../../../../../../../../packages/ui/src/components/input";
import {
  ModalFooterButton,
  use_modal
} from "../../../../../../../../../../../../../packages/ui/src/components/modal";
import Option from "../../../../../../../../../../../../../packages/ui/src/components/option";
import {
  Root,
  Scrollbar,
  Thumb,
  Viewport
} from "../../../../../../../../../../../../../packages/ui/src/components/scroll-area";
import Select from "../../../../../../../../../../../../../packages/ui/src/components/select";
import ErrorState from "../../../../../../../../../../../../../packages/ui/src/entities/error-state";
import { use_debounce } from "../../../../../../../../../../../../../packages/ui/src/hooks/use-debounce";
import { use_media_query } from "../../../../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import SearchIcon from "~/icons/Search";
import UserHeartIcon from "~/icons/UserHeart";
import {
  get_query_error_type,
  use_get_friend_requests_query
} from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "./friend-requests.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

export type FriendRequestsSortValue = "popular" | "recent" | "old";

const renderKeyAtom = atom<string>(""); // Key to re-render the scrollbar

// Scroller

const Scroller = React.memo(
  React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
    ({ children, ...rest }, ref) => {
      const renderKey = use_atom_value(renderKeyAtom);
      return (
        <>
          <Viewport {...rest} ref={ref} tabIndex={-1}>
            {children}
          </Viewport>
          <Scrollbar key={renderKey} orientation="vertical">
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
  const [sort, setSort] = React.useState<FriendRequestsSortValue>("popular");
  const [query, setQuery] = React.useState<string>("");
  const [page, set_page] = React.useState<number>(1);
  const setRenderKey = use_set_atom(renderKeyAtom);
  const debounced_query = use_debounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_friend_requests_query({
      page,
      sort,
      query: debounced_query
    });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handleSortChange = React.useCallback(
    (newSort: FriendRequestsSortValue) => {
      set_page(1);
      setSort(newSort);
    },
    []
  );

  React.useEffect(() => {
    set_page(1);
  }, [query]);

  React.useEffect(() => {
    setRenderKey(`${page}:${query}`);
  }, [page, query, setRenderKey]);

  return (
    <div className={clsx("flex-col", styles.x, styles.content)}>
      <div className={clsx("flex-center", styles.x, styles["control-bar"])}>
        <Input
          autoFocus
          decorator={<SearchIcon />}
          disabled={!items.length}
          onChange={(event): void => setQuery(event.target.value)}
          placeholder={"Search"}
          slot_props={{
            container: {
              className: clsx("f-grow", styles.x, styles.input)
            }
          }}
          type={"search"}
          value={query}
        />
        <Divider orientation={"vertical"} />
        <Select
          disabled={!items.length}
          onValueChange={handleSortChange}
          slot_props={{
            trigger: {
              "aria-label": "Sort items",
              className: clsx(
                "focus-invert",
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
      {isLoading || is_typing || (isFetching && page === 1) ? (
        <SuspenseLoader />
      ) : isError ? (
        <ErrorState
          auto_size
          component_props={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState query={query} />
      ) : (
        <Root className={clsx(styles.x, styles["scroll-area"])} type={"auto"}>
          <VirtualizedFriendRequestList
            components={{ Scroller }}
            friendRequests={items}
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
        className={"fit-w"}
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
