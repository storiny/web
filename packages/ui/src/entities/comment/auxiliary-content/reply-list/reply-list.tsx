import {
  ReplyListSkeleton,
  VirtualizedReplyList
} from "@storiny/web/src/common/reply";
import React from "react";

import ErrorState from "~/entities/ErrorState";
import { getQueryErrorType, useGetCommentRepliesQuery } from "~/redux/features";

const CommentReplyList = (props: { commentId: string }): React.ReactElement => {
  const { commentId } = props;
  const [page, setPage] = React.useState<number>(1);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetCommentRepliesQuery({
      page,
      commentId
    });
  const { items = [], hasMore } = data || {};

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  return (
    <React.Fragment>
      {isLoading ? <ReplyListSkeleton nested /> : null}
      {isError ? (
        <ErrorState
          autoSize
          componentProps={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={getQueryErrorType(error)}
        />
      ) : !isFetching && !items.length ? null : (
        <VirtualizedReplyList
          hasMore={Boolean(hasMore)}
          loadMore={loadMore}
          replies={items}
          replyProps={{ nested: true }}
          skeletonProps={{ nested: true }}
        />
      )}
    </React.Fragment>
  );
};

export default CommentReplyList;
