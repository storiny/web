import { clsx } from "clsx";
import { useAtomValue } from "jotai/index";
import React from "react";

import { CommentListSkeleton, VirtualizedCommentList } from "~/common/comment";
import Divider from "../../../../../ui/src/components/divider";
import ErrorState from "../../../../../ui/src/entities/error-state";
import {
  get_query_error_type,
  use_get_story_comments_query
} from "~/redux/features";

import { storyMetadataAtom } from "../../../atoms";
import styles from "../auxiliary-content.module.scss";
import PostComment from "../post-comment";
import { EditorAuxiliaryContentCommentListProps } from "./comment-list.props";
import EditorAuxiliaryContentEmptyState from "./empty-state";

const EditorAuxiliaryContentCommentList = (
  props: EditorAuxiliaryContentCommentListProps
): React.ReactElement => {
  const { sort, setSort } = props;
  const story = use_atom_value(storyMetadataAtom);
  const [page, set_page] = React.useState<number>(1);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_story_comments_query({
      storyId: story.id,
      page,
      sort,
      type: "all"
    });
  const { items = [], has_more } = data || {};
  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
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
          auto_size
          component_props={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !isFetching && !items.length ? (
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
