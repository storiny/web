import { Blog } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { BlogProps } from "~/entities/blog";

export interface VirtualizedBlogListProps extends VirtuosoProps<Blog, any> {
  /**
   * Props passed down to individual blog entities.
   */
  blog_props?: Partial<BlogProps>;
  /**
   * Array of blogs to render.
   */
  blogs: Blog[];
  /**
   * Flag indicating whether there are more blogs to render.
   */
  has_more: boolean;
  /**
   * A callback function to fetch more blogs.
   */
  load_more: () => void;
}
