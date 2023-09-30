import {
  ReplyListSkeleton,
  VirtualizedReplyList
} from "@storiny/web/src/common/reply";
import React from "react";

import ErrorState from "~/entities/error-state";
import {
  get_query_error_type,
  use_get_comment_replies_query
} from "~/redux/features";

const CommentReplyList = (props: {
  comment_id: string;
}): React.ReactElement => {
  const { comment_id } = props;
  const [page, set_page] = React.useState<number>(1);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_comment_replies_query({
    page,
    comment_id
  });
  const { items = [], has_more } = data || {};

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  return (
    <React.Fragment>
      {is_loading || (is_fetching && page === 1) ? (
        <ReplyListSkeleton nested />
      ) : is_error ? (
        <ErrorState
          auto_size
          component_props={{
            button: { loading: is_fetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !is_fetching && !items.length ? null : (
        <VirtualizedReplyList
          has_more={Boolean(has_more)}
          load_more={load_more}
          replies={items}
          reply_props={{ nested: true }}
          // Handle the reply list nicely
          scrollSeekConfiguration={undefined}
          skeleton_props={{ nested: true }}
        />
      )}
    </React.Fragment>
  );
};

export default CommentReplyList;
