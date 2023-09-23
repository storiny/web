export interface ReplySkeletonProps {
  /**
   * If `true`, renders with static properties
   */
  isStatic?: boolean;
  /**
   * Whether the skeleton is nested under a comment.
   */
  nested?: boolean;
  /**
   * Whether the skeleton is rendered inside a virtualized list.
   */
  virtual?: boolean;
}
