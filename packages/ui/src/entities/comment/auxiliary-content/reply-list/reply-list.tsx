import {
  ReplyListSkeleton,
  VirtualizedReplyList
} from "@storiny/web/src/common/reply";
import React from "react";

import ErrorState from "~/entities/ErrorState";
import {
  get_query_error_type,
  use_get_comment_replies_query
} from "~/redux/features";

const CommentReplyList = (props: { commentId: string }): React.ReactElement => {
  const { commentId } = props;
  const [page, setPage] = React.useState<number>(1);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_comment_replies_query({
      page,
      commentId
    });
  const { items = [], has_more } = data || {};

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  return (
    <React.Fragment>
      {isLoading || (isFetching && page === 1) ? (
        <ReplyListSkeleton nested />
      ) : isError ? (
        <ErrorState
          autoSize
          component_props={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !isFetching && !items.length ? null : (
        <VirtualizedReplyList
          has_more={Boolean(has_more)}
          loadMore={loadMore}
          replies={items}
          replyProps={{ nested: true }}
          // Handle the reply list nicely
          scrollSeekConfiguration={undefined}
          skeletonProps={{ nested: true }}
        />
      )}
    </React.Fragment>
  );
};

export default CommentReplyList;
