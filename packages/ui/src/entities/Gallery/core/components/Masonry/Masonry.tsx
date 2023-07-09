"use client";

import clsx from "clsx";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Photo } from "pexels";
import React from "react";
import { useInView } from "react-intersection-observer";

import Image from "~/components/Image";
import Link from "~/components/Link";
import MasonryPrimitive, { RenderItemArgs } from "~/components/Masonry";
import ScrollArea from "~/components/ScrollArea";
import Spacer from "~/components/Spacer";
import Spinner from "~/components/Spinner";
import { useDebounce } from "~/hooks/useDebounce";
import { useGetGalleryPhotosQuery } from "~/redux/features";

import { fetchingAtom, queryAtom, selectedAtom } from "../../atoms";
import styles from "./Masonry.module.scss";

// Masonry item

const MasonryItem = React.memo(
  ({ data }: RenderItemArgs<Photo>): React.ReactElement => {
    const [selected, setSelected] = useAtom(selectedAtom);
    const isSelected = selected?.id === String(data.id);

    return (
      <div
        className={clsx("flex-center", styles["image-wrapper"])}
        data-selected={String(isSelected)}
        onClick={(): void =>
          setSelected({
            src: data.src.small,
            id: String(data.id)
          })
        }
      >
        <Image
          alt={data.alt || ""}
          className={styles.image}
          hex={(data.avg_color || "").substring(1)}
          slotProps={{
            image: {
              className: styles["image-child"]
            },
            fallback: {
              style: { display: "none" }
            }
          }}
          src={data.src.medium}
          style={{
            width: "100%",
            paddingTop: `${(data.height / data.width) * 100}%`
          }}
        />
        <div className={clsx("flex-col", styles.overlay)}>
          <Link
            className={styles.link}
            ellipsis
            href={`${data.url}?utm_source=storiny`}
            level={"body2"}
            target={"_blank"}
            title={`Photo by ${data.photographer} on Pexels`}
          >
            {data.photographer}
          </Link>
        </div>
      </div>
    );
  }
);

MasonryItem.displayName = "MasonryItem";

// Footer

const Footer = React.memo<{
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

Footer.displayName = "Footer";

const Masonry = (): React.ReactElement => {
  const containerRef = React.useRef(null);
  const [page, setPage] = React.useState<number>(1);
  const query = useAtomValue(queryAtom);
  const setFetching = useSetAtom(fetchingAtom);
  const debouncedQuery = useDebounce(query);
  const { data, isFetching, isLoading } = useGetGalleryPhotosQuery({
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
    <ScrollArea
      className={styles.scroller}
      slotProps={{
        viewport: { ref: containerRef, className: styles.viewport }
      }}
      type={"auto"}
    >
      <MasonryPrimitive<Photo>
        getItemKey={(data): string => String(data.id)}
        gutterWidth={12}
        items={items}
        minCols={3}
        overscanFactor={2.8}
        renderItem={(args): React.ReactElement => <MasonryItem {...args} />}
        scrollContainer={(): HTMLElement => containerRef.current!}
      />
      <Footer
        containerRef={containerRef}
        hasMore={Boolean(hasMore)}
        incrementPage={incrementPage}
        isFetching={isFetching}
      />
    </ScrollArea>
  );
};

export default Masonry;
