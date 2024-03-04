import { ContentType } from "@storiny/shared";
import { BlogRightSidebarItem } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blogs/${id}/settings/sidebars/rsb`;

export type BlogRsbSettingsPayload = {
  blog_id: string;
  items: Omit<BlogRightSidebarItem, "id">[];
};

export type BlogRsbSettingsResponse = BlogRightSidebarItem[];

export const { useBlogRsbSettingsMutation: use_blog_rsb_settings_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      blogRsbSettings: builder.mutation<
        BlogRsbSettingsResponse,
        BlogRsbSettingsPayload
      >({
        query: ({ blog_id, ...rest }) => ({
          url: `/${SEGMENT(blog_id)}`,
          method: "PATCH",
          body: rest,
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
