import { BlogMemberRequest } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { BlogMemberRequestProps } from "~/entities/blog-member-request";

export interface VirtualizedBlogMemberRequestListProps
  extends VirtuosoProps<BlogMemberRequest, any> {
  /**
   * Props passed down to individual blog member request entities.
   */
  blog_member_request_props?: Omit<Partial<BlogMemberRequestProps>, "role"> &
    Required<Pick<BlogMemberRequestProps, "role">>;
  /**
   * Array of blog member requests to render.
   */
  blog_member_requests: BlogMemberRequest[];
  /**
   * Flag indicating whether there are more blog member requests to render.
   */
  has_more: boolean;
  /**
   * A callback function to fetch more blog member requests.
   */
  load_more: () => void;
}
