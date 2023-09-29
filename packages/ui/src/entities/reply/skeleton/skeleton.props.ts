export interface ReplySkeletonProps {
  /**
   * If `true`, renders with static properties
   */
  is_static?: boolean;
  /**
   * Whether the skeleton is nested under a comment.
   */
  nested?: boolean;
  /**
   * Whether the skeleton is rendered inside a virtualized list.
   */
  virtual?: boolean;
}
