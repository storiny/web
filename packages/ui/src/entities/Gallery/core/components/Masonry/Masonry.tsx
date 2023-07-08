"use client";

import { useAtomValue } from "jotai";
import {
  useInfiniteLoader,
  useMasonry,
  usePositioner,
  useResizeObserver
} from "masonic";
import { Photo } from "pexels";
import React from "react";

import ScrollArea from "~/components/ScrollArea";
import { useDebounce } from "~/hooks/useDebounce";
import { useGetGalleryPhotosQuery } from "~/redux/features";

import { queryAtom } from "../../atoms";
import { useScroller, useSize } from "../../hooks";
import styles from "./Masonry.module.scss";

const COLUMN_WIDTH = 148;

// Masonry item

const MasonryItem = React.memo(
  ({ data }: { data: Photo }): React.ReactElement => (
    <div className={"flex-col"} style={{ padding: "4px" }}>
      <img
        alt={data.alt || ""}
        src={data.src.medium}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  )
);

MasonryItem.displayName = "MasonryItem";

// Masonry lsit

const MasonryList = React.memo(
  ({
    items,
    incrementPage
  }: {
    incrementPage: () => void;
    items: Photo[];
  }): React.ReactElement => {
    const containerRef = React.useRef(null);
    const { width, height } = useSize(containerRef);
    const { scrollTop, isScrolling } = useScroller(containerRef);
    const positioner = usePositioner(
      {
        width,
        columnWidth: COLUMN_WIDTH,
        columnGutter: 6
      },
      []
    );
    const resizeObserver = useResizeObserver(positioner);
    const onRender = useInfiniteLoader(incrementPage, {
      isItemLoaded: (index, items) => !!items[index],
      minimumBatchSize: 1,
      threshold: 32
    });

    const content = useMasonry({
      positioner,
      resizeObserver,
      items,
      height,
      //itemKey: (data, index) => data?.id ?? index,
      scrollTop,
      isScrolling,
      onRender,
      overscanBy: 4,
      render: MasonryItem
    });

    return (
      <ScrollArea
        className={styles.scroller}
        slotProps={{
          viewport: { ref: containerRef, className: styles.viewport }
        }}
        type={"auto"}
      >
        {content}
      </ScrollArea>
    );
  }
);

MasonryList.displayName = "MasonryList";

const Masonry = (): React.ReactElement => {
  const [page, setPage] = React.useState<number>(1);
  const query = useAtomValue(queryAtom);
  const debouncedQuery = useDebounce(query);
  const isTyping = query !== debouncedQuery;
  const { data: { items = [] } = {}, isLoading } = useGetGalleryPhotosQuery({
    page,
    query: debouncedQuery
  });

  const incrementPage = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  if (isLoading || isTyping) {
    return <h1>Loading...</h1>;
  }

  return (
    <MasonryList
      incrementPage={incrementPage}
      items={items}
      key={query ? page : "_"}
    />
  );
};

export default Masonry;
