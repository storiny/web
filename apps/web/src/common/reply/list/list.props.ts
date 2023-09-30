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
  load_more: () => void;
  /**
   * Array of replies to render.
   */
  replies: Reply[];
  /**
   * Props passed down to individual reply entities.
   */
  reply_props?: Partial<ReplyProps>;
  /**
   * Props passed down to individual reply skeleton entities.
   */
  skeleton_props?: Partial<ReplySkeletonProps>;
}
