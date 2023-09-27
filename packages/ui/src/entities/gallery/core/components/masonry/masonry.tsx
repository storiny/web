"use client";

import { dynamicLoader } from "@storiny/web/src/common/dynamic";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import dynamic from "next/dynamic";
import React from "react";
import { useInView } from "react-intersection-observer";

import Masonry from "~/components/Masonry";
import ScrollArea from "~/components/ScrollArea";
import Spacer from "~/components/Spacer";
import Spinner from "~/components/Spinner";
import ErrorState from "~/entities/ErrorState";
import { useDebounce } from "~/hooks/useDebounce";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import {
  get_query_error_type,
  GetGalleryPhotosResponse,
  GetUserAssetsResponse,
  use_get_assets_query,
  use_get_gallery_photos_query
} from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

import { pendingImageAtom, queryAtom } from "../../atoms";
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
  containerRef,
  minCols
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  minCols: number;
}): React.ReactElement => {
  const [page, setPage] = React.useState<number>(1);
  const query = useAtomValue(queryAtom);
  const debouncedQuery = useDebounce(query);
  const { data, isFetching, isLoading, isError, error, refetch } =
    use_get_gallery_photos_query({
      page,
      query: debouncedQuery
    });
  const { items = [], has_more } = data || {};
  const isTyping = debouncedQuery !== query;

  const incrementPage = React.useCallback(() => {
    setPage((prevState) => prevState + 1);
  }, []);

  React.useEffect(() => {
    setPage(1);
  }, [query]);

  return (
    <React.Fragment>
      {isLoading || isTyping || (isFetching && page === 1) ? (
        <div
          aria-busy={"true"}
          className={clsx("full-w", "full-h", "flex-center")}
          style={{ padding: "32px" }}
        >
          <Spinner />
        </div>
      ) : isError ? (
        <ErrorState
          autoSize
          component_props={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState tab={"pexels"} />
      ) : (
        <React.Fragment>
          <Masonry<GetGalleryPhotosResponse[number]>
            getItemKey={(data): string => String(data.id)}
            gutterWidth={12}
            items={items}
            minCols={minCols}
            overscanFactor={2.8}
            renderItem={(args): React.ReactElement => (
              <PexelsMasonryItem {...args} />
            )}
            scrollContainer={(): HTMLElement => containerRef.current!}
          />
          <GalleryMasonryFooter
            containerRef={containerRef}
            has_more={Boolean(has_more)}
            incrementPage={incrementPage}
            isFetching={isFetching}
          />
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

// User library

const Library = ({
  containerRef,
  minCols
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  minCols: number;
}): React.ReactElement => {
  const [page, setPage] = React.useState<number>(1);
  const { data, isFetching, isLoading, isError, error, refetch } =
    use_get_assets_query({
      page
    });
  const { items = [], has_more } = data || {};

  const incrementPage = React.useCallback(() => {
    setPage((prevState) => prevState + 1);
  }, []);

  return (
    <React.Fragment>
      {isLoading || (isFetching && page === 1) ? (
        <div
          aria-busy={"true"}
          className={clsx("full-w", "full-h", "flex-center")}
          style={{ padding: "32px" }}
        >
          <Spinner />
        </div>
      ) : isError ? (
        <ErrorState
          autoSize
          component_props={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState tab={"library"} />
      ) : (
        <Masonry<GetUserAssetsResponse[number]>
          getItemKey={(data): string => String(data.id)}
          gutterWidth={12}
          items={items}
          minCols={minCols}
          overscanFactor={2.8}
          renderItem={(args): React.ReactElement => (
            <LibraryMasonryItem {...args} />
          )}
          scrollContainer={(): HTMLElement => containerRef.current!}
        />
      )}
      <GalleryMasonryFooter
        containerRef={containerRef}
        has_more={Boolean(has_more)}
        incrementPage={incrementPage}
        isFetching={isFetching}
      />
    </React.Fragment>
  );
};

// Footer

const GalleryMasonryFooter = React.memo<{
  containerRef: React.RefObject<HTMLElement>;
  has_more: boolean;
  incrementPage: () => void;
  isFetching: boolean;
}>(({ containerRef, has_more, isFetching, incrementPage }) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    root: containerRef.current,
    rootMargin: "0px 0px 500px 0px"
  });

  React.useEffect(() => {
    if (inView && has_more && !isFetching) {
      incrementPage();
    }
  }, [has_more, inView, incrementPage, isFetching]);

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
  const { tab, onPexelsUploadFinish = (): void => undefined } = props;
  const pendingImage = useAtomValue(pendingImageAtom);
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  const containerRef = React.useRef<HTMLDivElement>(null);
  const minCols = isSmallerThanTablet ? 2 : 3;

  if (tab === "pexels" && pendingImage !== null) {
    return <PexelsUploader onUploadFinish={onPexelsUploadFinish} />;
  }

  return (
    <ScrollArea
      className={styles.scroller}
      slot_props={{
        viewport: {
          tabIndex: -1,
          ref: containerRef,
          className: styles.viewport
        }
      }}
      type={"auto"}
    >
      {tab === "pexels" ? (
        <Pexels containerRef={containerRef} minCols={minCols} />
      ) : (
        <Library containerRef={containerRef} minCols={minCols} />
      )}
    </ScrollArea>
  );
};

export default GalleryMasonry;
