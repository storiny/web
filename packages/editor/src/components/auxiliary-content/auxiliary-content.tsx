import { clsx } from "clsx";
import { useAtomValue, useSetAtom } from "jotai";
import React from "react";
import { useIntersectionObserver } from "react-intersection-observer-hook";

import { CommentListSkeleton, VirtualizedCommentList } from "~/common/comment";
import Divider from "~/components/Divider";
import Option from "~/components/Option";
import Select from "~/components/Select";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import ErrorState from "~/entities/ErrorState";
import { getQueryErrorType, useGetStoryCommentsQuery } from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import { isAuxiliaryContentVisibleAtom, storyMetadataAtom } from "../../atoms";
import styles from "./auxiliary-content.module.scss";
import EditorAuxiliaryContentEmptyState from "./empty-state";
import PostComment from "./post-comment";

type StoryCommentsSortValue = "likes-dsc" | "recent";

// Content

const Content = (): React.ReactElement => {
  const story = useAtomValue(storyMetadataAtom);
  const commentCount =
    useAppSelector((state) => state.entities.storyCommentCounts[story.id]) || 0;
  const [page, setPage] = React.useState<number>(1);
  const [sort, setSort] = React.useState<StoryCommentsSortValue>("likes-dsc");
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetStoryCommentsQuery({
      storyId: story.id,
      page,
      sort,
      type: "all"
    });
  const { items = [], hasMore } = data || {};
  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  return (
    <React.Fragment>
      <header className={clsx("flex-center", styles.header)}>
        <Typography
          className={clsx("t-bold", "f-grow", styles.x, styles["header-label"])}
          level={"body2"}
        >
          {abbreviateNumber(commentCount)}{" "}
          {commentCount === 1 ? "comment" : "comments"}
        </Typography>
        <Divider orientation={"vertical"} />
        <Select
          onValueChange={(nextValue): void =>
            setSort(nextValue as StoryCommentsSortValue)
          }
          slotProps={{
            trigger: {
              "aria-label": "Sort comments",
              className: clsx(
                "focus-invert",
                styles.x,
                styles["select-trigger"]
              )
            },
            value: {
              placeholder: "Sort"
            }
          }}
          value={sort}
        >
          <Option value={"likes-dsc"}>Relevant</Option>
          <Option value={"recent"}>Recent</Option>
        </Select>
      </header>
      <Spacer
        className={styles["header-spacer"]}
        orientation={"vertical"}
        size={4.75}
      />
      <PostComment
        // Show the newly added comment
        onPost={(): void => setSort("recent")}
      />
      <Divider className={clsx(styles.x, styles["full-width-divider"])} />
      {isLoading ? <CommentListSkeleton /> : null}
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
        <EditorAuxiliaryContentEmptyState />
      ) : (
        <VirtualizedCommentList
          comments={items}
          hasMore={Boolean(hasMore)}
          loadMore={loadMore}
          // Disable Virtualization as when the boundary elements exit the viewport, their reply
          // list will collapse, causing a jump in the layout.
          overscan={Infinity}
          scrollSeekConfiguration={undefined}
        />
      )}
    </React.Fragment>
  );
};

const EditorAuxiliaryContent = (): React.ReactElement => {
  const setIsAuxiliaryContentVisible = useSetAtom(
    isAuxiliaryContentVisibleAtom
  );
  const [ref, { entry }] = useIntersectionObserver({
    rootMargin: "-52px 0px 0px 0px"
  });

  React.useEffect(() => {
    setIsAuxiliaryContentVisible(Boolean(entry && entry.isIntersecting));
  }, [entry, setIsAuxiliaryContentVisible]);

  return (
    <React.Fragment>
      <section
        className={clsx("flex-col", styles["auxiliary-content"])}
        ref={ref}
      >
        <Content />
      </section>
    </React.Fragment>
  );
};

export default EditorAuxiliaryContent;
