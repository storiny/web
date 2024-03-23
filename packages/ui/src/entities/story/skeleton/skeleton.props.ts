export interface StorySkeletonProps {
  /**
   * If `true`, renders a large skeleton
   */
  is_large?: boolean;
  /**
   * If `true`, renders a compact skeleton
   */
  is_small?: boolean;
  /**
   * Whether the skeleton is rendered inside a virtualized list.
   */
  virtual?: boolean;
}
