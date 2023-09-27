import { Reply } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { ReplyProps } from "~/entities/reply";
import { ReplySkeletonProps } from "~/entities/reply/skeleton";

export interface VirtualizedReplyListProps extends VirtuosoProps<Reply, any> {
  /**
   * Flag indicating whether there are more replies to render.
   */
  has_more: boolean;
  /**
   * A callback function to fetch more replies.
   */
  loadMore: () => void;
  /**
   * Array of replies to render.
   */
  replies: Reply[];
  /**
   * Props passed down to individual reply entities.
   */
  replyProps?: Partial<ReplyProps>;
  /**
   * Props passed down to individual reply skeleton entities.
   */
  skeletonProps?: Partial<ReplySkeletonProps>;
}
