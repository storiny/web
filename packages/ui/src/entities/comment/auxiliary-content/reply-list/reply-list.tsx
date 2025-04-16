import {
  ReplyListSkeleton,
  VirtualizedReplyList
} from "@storiny/web/src/common/reply";
import React from "react";

import ErrorState from "~/entities/error-state";
import { use_default_fetch } from "~/hooks/use-default-fetch";
import { use_pagination } from "~/hooks/use-pagination";
import {
  get_query_error_type,
  select_comment_replies,
  use_get_comment_replies_query
} from "~/redux/features";

const CommentReplyList = (props: {
  comment_id: string;
}): React.ReactElement => {
  const { comment_id } = props;
  const page = use_pagination(
    select_comment_replies({
      page: 1,
      comment_id
    })
  );
  const [
    trigger,
    {
      data: { items = [], has_more } = {},
      isLoading: is_loading,
      isFetching: is_fetching,
      isError: is_error,
      error
    }
  ] = use_get_comment_replies_query();
  const refetch = use_default_fetch(
    trigger,
    {
      page,
      comment_id
    },
    [comment_id]
  );

  const load_more = React.useCallback(() => {
    trigger(
      {
        page: page + 1,
        comment_id
      },
      true
    );
  }, [comment_id, page, trigger]);

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
