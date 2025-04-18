import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import { CommentListSkeleton, VirtualizedCommentList } from "~/common/comment";
import Divider from "~/components/divider";
import ErrorState from "~/entities/error-state";
import { use_default_fetch } from "~/hooks/use-default-fetch";
import { use_pagination } from "~/hooks/use-pagination";
import {
  get_query_error_type,
  select_story_comments,
  use_get_story_comments_query
} from "~/redux/features";

import { story_metadata_atom } from "../../../atoms";
import styles from "../auxiliary-content.module.scss";
import PostComment from "../post-comment";
import { EditorAuxiliaryContentCommentListProps } from "./comment-list.props";
import EditorAuxiliaryContentEmptyState from "./empty-state";

const EditorAuxiliaryContentCommentList = (
  props: EditorAuxiliaryContentCommentListProps
): React.ReactElement => {
  const { sort, set_sort } = props;
  const story = use_atom_value(story_metadata_atom);
  const page = use_pagination(
    select_story_comments({
      story_id: story.id,
      page: 1,
      sort,
      type: "all"
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
  ] = use_get_story_comments_query();
  const refetch = use_default_fetch(
    trigger,
    {
      story_id: story.id,
      page,
      sort,
      type: "all"
    },
    [story.id, sort]
  );

  const load_more = React.useCallback(() => {
    trigger(
      {
        story_id: story.id,
        page: page + 1,
        sort,
        type: "all"
      },
      true
    );
  }, [page, sort, story.id, trigger]);

  return (
    <React.Fragment>
      <PostComment
        // Show the newly added comment
        on_post={(): void => set_sort("recent")}
      />
      <Divider className={clsx(styles.x, styles["full-width-divider"])} />
      {is_loading || (is_fetching && page === 1) ? (
        <CommentListSkeleton />
      ) : is_error ? (
        <ErrorState
          auto_size
          component_props={{
            button: { loading: is_fetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !is_fetching && !items.length ? (
        <EditorAuxiliaryContentEmptyState />
      ) : (
        <VirtualizedCommentList
          comments={items}
          has_more={Boolean(has_more)}
          load_more={load_more}
          // Disable scroll seekers to handle expanded reply lists.
          scrollSeekConfiguration={undefined}
        />
      )}
    </React.Fragment>
  );
};

export default EditorAuxiliaryContentCommentList;
