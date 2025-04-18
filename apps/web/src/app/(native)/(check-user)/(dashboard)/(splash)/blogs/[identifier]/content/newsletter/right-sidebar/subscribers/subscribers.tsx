import { clsx } from "clsx";
import {
  atom,
  useAtomValue as use_atom_value,
  useSetAtom as use_set_atom
} from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { dynamic_loader } from "~/common/dynamic";
import { VirtualizedSubscriberList } from "~/common/subscriber";
import SuspenseLoader from "~/common/suspense-loader";
import Button from "~/components/button";
import { ModalFooterButton, use_modal } from "~/components/modal";
import { Root, Scrollbar, Thumb, Viewport } from "~/components/scroll-area";
import ErrorState from "~/entities/error-state";
import { use_default_fetch } from "~/hooks/use-default-fetch";
import { use_media_query } from "~/hooks/use-media-query";
import { use_pagination } from "~/hooks/use-pagination";
import UsersIcon from "~/icons/users";
import {
  get_query_error_type,
  select_blog_subscribers,
  use_get_blog_subscribers_query
} from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import styles from "./subscribers.module.scss";

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

const SubscribersModal = (): React.ReactElement => {
  const set_render_key = use_set_atom(render_key_atom);
  const blog = use_blog_context();
  const page = use_pagination(
    select_blog_subscribers({
      blog_id: blog.id,
      page: 1
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
  ] = use_get_blog_subscribers_query();
  const refetch = use_default_fetch(
    trigger,
    {
      blog_id: blog.id,
      page
    },
    [blog.id]
  );

  const load_more = React.useCallback(() => {
    trigger(
      {
        blog_id: blog.id,
        page: page + 1
      },
      true
    );
  }, [blog.id, page, trigger]);

  React.useEffect(() => {
    set_render_key(`${page}`);
  }, [page, set_render_key]);

  return (
    <div className={clsx(css["flex-col"], styles.content)}>
      {is_loading || (is_fetching && page === 1) ? (
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
        <EmptyState />
      ) : (
        <Root className={clsx(styles.x, styles["scroll-area"])} type={"auto"}>
          <VirtualizedSubscriberList
            components={{ Scroller }}
            has_more={Boolean(has_more)}
            load_more={load_more}
            subscribers={items}
            useWindowScroll={false}
          />
        </Root>
      )}
    </div>
  );
};

const Subscribers = (): React.ReactElement => {
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
        View subscribers
      </Button>
    ),
    <SubscribersModal />,
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
          decorator: <UsersIcon />,
          children: "Subscribers"
        }
      }
    }
  );

  return element;
};

export default Subscribers;
