import { BlogRequest } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { BlogRequestProps } from "~/entities/blog-request";

export interface VirtualizedBlogRequestListProps
  extends VirtuosoProps<BlogRequest, any> {
  /**
   * Props passed down to individual blog request entities.
   */
  blog_request_props?: Partial<BlogRequestProps>;
  /**
   * Array of blog requests to render.
   */
  blog_requests: BlogRequest[];
  /**
   * Flag indicating whether there are more blog requests to render.
   */
  has_more: boolean;
  /**
   * A callback function to fetch more blog requests.
   */
  load_more: () => void;
}
