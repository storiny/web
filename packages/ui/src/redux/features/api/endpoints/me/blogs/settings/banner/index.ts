import { ContentType } from "@storiny/shared";
import { Blog } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blogs/${id}/settings/banner`;

export type BlogBannerSettingsResponse = Pick<Blog, "banner_id" | "banner_hex">;

export interface BlogBannerSettingsPayload {
  banner_id: string | null;
  blog_id: string;
}

export const {
  useBlogBannerSettingsMutation: use_blog_banner_settings_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    blogBannerSettings: builder.mutation<
      BlogBannerSettingsResponse,
      BlogBannerSettingsPayload
    >({
      query: ({ banner_id, blog_id }) => ({
        url: `/${SEGMENT(blog_id)}`,
        method: "PATCH",
        body: { banner_id },
        headers: {
          "Content-type": ContentType.JSON
        }
      })
    })
  })
});
