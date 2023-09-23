import { Tag } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { TagProps } from "~/entities/tag";

export interface VirtualizedTagListProps extends VirtuosoProps<Tag, any> {
  /**
   * Flag indicating whether there are more tags to render.
   */
  hasMore: boolean;
  /**
   * A callback function to fetch more tags.
   */
  loadMore: () => void;
  /**
   * Props passed down to individual tag entities.
   */
  tagProps?: Partial<TagProps>;
  /**
   * Array of tags to render.
   */
  tags: Tag[];
}
