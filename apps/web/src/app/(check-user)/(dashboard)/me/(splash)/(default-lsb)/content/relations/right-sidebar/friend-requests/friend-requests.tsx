import { clsx } from "clsx";
import { atom, useAtomValue, useSetAtom } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { VirtualizedFriendRequestList } from "~/common/friend-request";
import SuspenseLoader from "~/common/suspense-loader";
import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Input from "~/components/Input";
import { ModalFooterButton, useModal } from "~/components/Modal";
import Option from "~/components/Option";
import { Root, Scrollbar, Thumb, Viewport } from "~/components/ScrollArea";
import Select from "~/components/Select";
import ErrorState from "~/entities/ErrorState";
import { useDebounce } from "~/hooks/useDebounce";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import SearchIcon from "~/icons/Search";
import UserHeartIcon from "~/icons/UserHeart";
import { getQueryErrorType, useGetFriendRequestsQuery } from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

import styles from "./friend-requests.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: () => <SuspenseLoader />
});

export type FriendRequestsSortValue = "popular" | "recent" | "old";

const renderKeyAtom = atom<string>(""); // Key to re-render the scrollbar

// Scroller

const Scroller = React.memo(
  React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
    ({ children, ...rest }, ref) => {
      const renderKey = useAtomValue(renderKeyAtom);
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
  const [page, setPage] = React.useState<number>(1);
  const setRenderKey = useSetAtom(renderKeyAtom);
  const debouncedQuery = useDebounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetFriendRequestsQuery({
      page,
      sort,
      query: debouncedQuery
    });
  const { items = [], hasMore } = data || {};
  const isTyping = query !== debouncedQuery;

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  const handleSortChange = React.useCallback(
    (newSort: FriendRequestsSortValue) => setSort(newSort),
    []
  );

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
          slotProps={{
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
          slotProps={{
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
      {isLoading || isTyping ? (
        <SuspenseLoader />
      ) : isError ? (
        <ErrorState
          autoSize
          componentProps={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={getQueryErrorType(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState query={query} />
      ) : (
        <Root className={clsx(styles.x, styles["scroll-area"])} type={"auto"}>
          <VirtualizedFriendRequestList
            components={{ Scroller }}
            friendRequests={items}
            hasMore={Boolean(hasMore)}
            loadMore={loadMore}
            useWindowScroll={false}
          />
        </Root>
      )}
    </div>
  );
};

const FriendRequests = (): React.ReactElement => {
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const isSmallerThanDesktop = useMediaQuery(breakpoints.down("desktop"));
  const [element] = useModal(
    ({ openModal }) => (
      <Button
        autoSize
        checkAuth
        className={"fit-w"}
        onClick={openModal}
        variant={isSmallerThanDesktop ? "hollow" : "rigid"}
      >
        View requests
      </Button>
    ),
    <FriendRequestsModal />,
    {
      fullscreen: isSmallerThanMobile,
      footer: (
        <>
          <ModalFooterButton compact={isSmallerThanMobile}>
            Done
          </ModalFooterButton>
        </>
      ),
      slotProps: {
        footer: {
          compact: isSmallerThanMobile
        },
        body: {
          style: {
            padding: 0
          }
        },
        content: {
          style: {
            width: isSmallerThanMobile ? "100%" : "480px"
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
