import { Story } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { StoryProps } from "~/entities/story";
import { StorySkeletonProps } from "~/entities/story/skeleton";

export interface VirtualizedStoryListProps extends VirtuosoProps<Story, any> {
  /**
   * Flag indicating whether there are more stories to render.
   */
  has_more: boolean;
  /**
   * A callback function to fetch more stories.
   */
  load_more: () => void;
  /**
   * Props passed down to individual story skeleton entities.
   */
  skeleton_props?: Partial<StorySkeletonProps>;
  /**
   * Array of stories to render.
   */
  stories: Story[];
  /**
   * Props passed down to individual story entities.
   */
  story_props?: Partial<StoryProps>;
}
