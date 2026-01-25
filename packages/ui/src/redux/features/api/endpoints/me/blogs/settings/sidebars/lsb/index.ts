import { ContentType } from "@storiny/shared";
import { BlogLeftSidebarItem } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blogs/${id}/settings/sidebars/lsb`;

export type BlogLsbSettingsPayload = {
  blog_id: string;
  items: Omit<BlogLeftSidebarItem, "id">[];
};

export type BlogLsbSettingsResponse = BlogLeftSidebarItem[];

export const { useBlogLsbSettingsMutation: use_blog_lsb_settings_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      blogLsbSettings: builder.mutation<
        BlogLsbSettingsResponse,
        BlogLsbSettingsPayload
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
