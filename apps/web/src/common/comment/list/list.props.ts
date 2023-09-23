import { Comment } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { CommentProps } from "~/entities/comment";
import { CommentSkeletonProps } from "~/entities/comment/skeleton";

export interface VirtualizedCommentListProps
  extends VirtuosoProps<Comment, any> {
  /**
   * Props passed down to individual comment entities.
   */
  commentProps?: Partial<CommentProps>;
  /**
   * Array of comments to render.
   */
  comments: Comment[];
  /**
   * Flag indicating whether there are more comments to render.
   */
  hasMore: boolean;
  /**
   * A callback function to fetch more comments.
   */
  loadMore: () => void;
  /**
   * Props passed down to individual comment skeleton entities.
   */
  skeletonProps?: Partial<CommentSkeletonProps>;
}
