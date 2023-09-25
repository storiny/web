import { clsx } from "clsx";
import { useAtomValue } from "jotai/index";
import React from "react";

import { CommentListSkeleton, VirtualizedCommentList } from "~/common/comment";
import Divider from "~/components/Divider";
import ErrorState from "~/entities/ErrorState";
import { getQueryErrorType, useGetStoryCommentsQuery } from "~/redux/features";

import { storyMetadataAtom } from "../../../atoms";
import styles from "../auxiliary-content.module.scss";
import PostComment from "../post-comment";
import { EditorAuxiliaryContentCommentListProps } from "./comment-list.props";
import EditorAuxiliaryContentEmptyState from "./empty-state";

const EditorAuxiliaryContentCommentList = (
  props: EditorAuxiliaryContentCommentListProps
): React.ReactElement => {
  const { sort, setSort } = props;
  const story = useAtomValue(storyMetadataAtom);
  const [page, setPage] = React.useState<number>(1);
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
      <PostComment
        // Show the newly added comment
        onPost={(): void => setSort("recent")}
      />
      <Divider className={clsx(styles.x, styles["full-width-divider"])} />
      {isLoading || (isFetching && page === 1) ? (
        <CommentListSkeleton />
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
        <EditorAuxiliaryContentEmptyState />
      ) : (
        <VirtualizedCommentList
          comments={items}
          hasMore={Boolean(hasMore)}
          loadMore={loadMore}
          // Disable scroll seekers to handle expanded reply lists.
          scrollSeekConfiguration={undefined}
        />
      )}
    </React.Fragment>
  );
};

export default EditorAuxiliaryContentCommentList;
