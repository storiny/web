import { Comment } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { CommentProps } from "~/entities/comment";
import { CommentSkeletonProps } from "~/entities/comment/skeleton";

export interface VirtualizedCommentListProps
  extends VirtuosoProps<Comment, any> {
  /**
   * Props passed down to individual comment entities.
   */
  comment_props?: Partial<CommentProps>;
  /**
   * Array of comments to render.
   */
  comments: Comment[];
  /**
   * Flag indicating whether there are more comments to render.
   */
  has_more: boolean;
  /**
   * A callback function to fetch more comments.
   */
  load_more: () => void;
  /**
   * Props passed down to individual comment skeleton entities.
   */
  skeleton_props?: Partial<CommentSkeletonProps>;
}
