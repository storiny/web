"use client";

import { dynamicLoader } from "@storiny/web/src/common/dynamic";
import clsx from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import dynamic from "next/dynamic";
import React from "react";
import { useInView as use_in_view } from "react-intersection-observer";
import Masonry from "src/components/masonry";
import ScrollArea from "src/components/scroll-area";
import Spacer from "src/components/spacer";
import Spinner from "src/components/spinner";
import ErrorState from "src/entities/error-state";
import { use_debounce } from "src/hooks/use-debounce";
import { use_media_query } from "src/hooks/use-media-query";

import {
  get_query_error_type,
  GetGalleryPhotosResponse,
  GetUserAssetsResponse,
  use_get_assets_query,
  use_get_gallery_photos_query
} from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { pending_image_atom, query_atom } from "../../atoms";
import LibraryMasonryItem from "./library-item";
import styles from "./masonry.module.scss";
import { GalleryMasonryProps } from "./masonry.props";
import PexelsMasonryItem from "./pexels-item";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});
const PexelsUploader = dynamic(() => import("../pexels-uploader"), {
  loading: dynamicLoader()
});

// Pexels

const Pexels = ({
  container_ref,
  min_cols
}: {
  container_ref: React.RefObject<HTMLDivElement>;
  min_cols: number;
}): React.ReactElement => {
  const [page, set_page] = React.useState<number>(1);
  const query = use_atom_value(query_atom);
  const debounced_query = use_debounce(query);
  const {
    data,
    isFetching: is_fetching,
    isLoading: is_loading,
    isError: is_error,
    error,
    refetch
  } = use_get_gallery_photos_query({
    page,
    query: debounced_query
  });
  const { items = [], has_more } = data || {};
  const is_typing = debounced_query !== query;

  const increment_page = React.useCallback(() => {
    set_page((prev_state) => prev_state + 1);
  }, []);

  React.useEffect(() => {
    set_page(1);
  }, [query]);

  return (
    <React.Fragment>
      {is_loading || is_typing || (is_fetching && page === 1) ? (
        <div
          aria-busy={"true"}
          className={clsx("full-w", "full-h", "flex-center")}
          style={{ padding: "32px" }}
        >
          <Spinner />
        </div>
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
        <EmptyState tab={"pexels"} />
      ) : (
        <React.Fragment>
          <Masonry<GetGalleryPhotosResponse[number]>
            get_item_key={(data): string => String(data.id)}
            gutter_width={12}
            items={items}
            min_cols={min_cols}
            overscan_factor={2.8}
            render_item={(args): React.ReactElement => (
              <PexelsMasonryItem {...args} />
            )}
            scroll_container={(): HTMLElement => container_ref.current!}
          />
          <GalleryMasonryFooter
            container_ref={container_ref}
            has_more={Boolean(has_more)}
            increment_page={increment_page}
            is_fetching={is_fetching}
          />
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

// User library

const Library = ({
  container_ref,
  min_cols
}: {
  container_ref: React.RefObject<HTMLDivElement>;
  min_cols: number;
}): React.ReactElement => {
  const [page, set_page] = React.useState<number>(1);
  const {
    data,
    isFetching: is_fetching,
    isLoading: is_loading,
    isError: is_error,
    error,
    refetch
  } = use_get_assets_query({
    page
  });
  const { items = [], has_more } = data || {};

  const increment_page = React.useCallback(() => {
    set_page((prev_state) => prev_state + 1);
  }, []);

  return (
    <React.Fragment>
      {is_loading || (is_fetching && page === 1) ? (
        <div
          aria-busy={"true"}
          className={clsx("full-w", "full-h", "flex-center")}
          style={{ padding: "32px" }}
        >
          <Spinner />
        </div>
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
        <EmptyState tab={"library"} />
      ) : (
        <Masonry<GetUserAssetsResponse[number]>
          get_item_key={(data): string => String(data.id)}
          gutter_width={12}
          items={items}
          min_cols={min_cols}
          overscan_factor={2.8}
          render_item={(args): React.ReactElement => (
            <LibraryMasonryItem {...args} />
          )}
          scroll_container={(): HTMLElement => container_ref.current!}
        />
      )}
      <GalleryMasonryFooter
        container_ref={container_ref}
        has_more={Boolean(has_more)}
        increment_page={increment_page}
        is_fetching={is_fetching}
      />
    </React.Fragment>
  );
};

// Footer

const GalleryMasonryFooter = React.memo<{
  container_ref: React.RefObject<HTMLElement>;
  has_more: boolean;
  increment_page: () => void;
  is_fetching: boolean;
}>(({ container_ref, has_more, is_fetching, increment_page }) => {
  const { ref, inView: in_view } = use_in_view({
    threshold: 0.1,
    root: container_ref.current,
    rootMargin: "0px 0px 500px 0px"
  });

  React.useEffect(() => {
    if (in_view && has_more && !is_fetching) {
      increment_page();
    }
  }, [has_more, in_view, increment_page, is_fetching]);

  return (
    <div className={clsx("flex-col", "flex-center")} ref={ref}>
      {has_more && (
        <>
          <Spacer orientation={"vertical"} size={5} />
          <Spinner />
        </>
      )}
      <Spacer orientation={"vertical"} size={2} />
    </div>
  );
});

GalleryMasonryFooter.displayName = "GalleryMasonryFooter";

const GalleryMasonry = (props: GalleryMasonryProps): React.ReactElement => {
  const { tab, on_pexels_upload_finish = (): void => undefined } = props;
  const pending_image = use_atom_value(pending_image_atom);
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const container_ref = React.useRef<HTMLDivElement>(null);
  const min_cols = is_smaller_than_tablet ? 2 : 3;

  if (tab === "pexels" && pending_image !== null) {
    return <PexelsUploader on_upload_finish={on_pexels_upload_finish} />;
  }

  return (
    <ScrollArea
      className={styles.scroller}
      slot_props={{
        viewport: {
          tabIndex: -1,
          ref: container_ref,
          className: styles.viewport
        }
      }}
      type={"auto"}
    >
      {tab === "pexels" ? (
        <Pexels container_ref={container_ref} min_cols={min_cols} />
      ) : (
        <Library container_ref={container_ref} min_cols={min_cols} />
      )}
    </ScrollArea>
  );
};

export default GalleryMasonry;
