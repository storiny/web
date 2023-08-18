import { Story } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { StoryProps } from "~/entities/Story";
import { StorySkeletonProps } from "~/entities/Story/Skeleton";

export interface VirtualizedStoryListProps extends VirtuosoProps<Story, any> {
  /**
   * Flag indicating whether there are more stories to render.
   */
  hasMore: boolean;
  /**
   * A callback function to fetch more stories.
   */
  loadMore: () => void;
  /**
   * Props passed down to individual story skeleton entities.
   */
  skeletonProps?: Partial<StorySkeletonProps>;
  /**
   * Array of stories to render.
   */
  stories: Story[];
  /**
   * Props passed down to individual story entities.
   */
  storyProps?: Partial<StoryProps>;
}
