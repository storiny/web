"use client";

import { dynamicLoader } from "@storiny/web/src/common/dynamic";
import clsx from "clsx";
import { useAtomValue, useSetAtom } from "jotai";
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
  GetGalleryPhotosResponse,
  getQueryErrorType,
  GetUserAssetsResponse,
  useGetAssetsQuery,
  useGetGalleryPhotosQuery
} from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

import { fetchingAtom, pendingImageAtom, queryAtom } from "../../atoms";
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
  const setFetching = useSetAtom(fetchingAtom);
  const debouncedQuery = useDebounce(query);
  const { data, isFetching, isLoading, isError, error, refetch } =
    useGetGalleryPhotosQuery({
      page,
      query: debouncedQuery
    });
  const { items = [], hasMore } = data || {};

  const incrementPage = React.useCallback(() => {
    setPage((prevState) => prevState + 1);
  }, []);

  React.useEffect(() => {
    setFetching(isLoading);
  }, [isLoading, setFetching]);

  return (
    <React.Fragment>
      {isLoading ? (
        <div
          aria-busy={"true"}
          className={clsx("full-w", "full-h", "flex-center")}
          style={{ padding: "32px" }}
        >
          <Spinner />
        </div>
      ) : null}
      {isError ? (
        <ErrorState
          autoSize
          componentProps={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={getQueryErrorType(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState tab={"pexels"} />
      ) : (
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
      )}
      <GalleryMasonryFooter
        containerRef={containerRef}
        hasMore={Boolean(hasMore)}
        incrementPage={incrementPage}
        isFetching={isFetching}
      />
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
    useGetAssetsQuery({
      page
    });
  const { items = [], hasMore } = data || {};

  const incrementPage = React.useCallback(() => {
    setPage((prevState) => prevState + 1);
  }, []);

  return (
    <React.Fragment>
      {isLoading ? (
        <div
          aria-busy={"true"}
          className={clsx("full-w", "full-h", "flex-center")}
          style={{ padding: "32px" }}
        >
          <Spinner />
        </div>
      ) : null}
      {isError ? (
        <ErrorState
          autoSize
          componentProps={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={getQueryErrorType(error)}
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
        hasMore={Boolean(hasMore)}
        incrementPage={incrementPage}
        isFetching={isFetching}
      />
    </React.Fragment>
  );
};

// Footer

const GalleryMasonryFooter = React.memo<{
  containerRef: React.RefObject<HTMLElement>;
  hasMore: boolean;
  incrementPage: () => void;
  isFetching: boolean;
}>(({ containerRef, hasMore, isFetching, incrementPage }) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    root: containerRef.current,
    rootMargin: "0px 0px 500px 0px"
  });

  React.useEffect(() => {
    if (inView && hasMore && !isFetching) {
      incrementPage();
    }
  }, [hasMore, inView, incrementPage, isFetching]);

  return (
    <div className={clsx("flex-col", "flex-center")} ref={ref}>
      {hasMore && (
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
      slotProps={{
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
