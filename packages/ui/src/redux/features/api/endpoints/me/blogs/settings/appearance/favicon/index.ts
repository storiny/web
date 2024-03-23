import { ContentType } from "@storiny/shared";
import { Blog } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string =>
  `me/blogs/${id}/settings/appearance/favicon`;

export type BlogFaviconSettingsResponse = Pick<Blog, "favicon">;

export interface BlogFaviconSettingsPayload {
  blog_id: string;
  favicon: string | null;
}

export const {
  useBlogFaviconSettingsMutation: use_blog_favicon_settings_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    blogFaviconSettings: builder.mutation<
      BlogFaviconSettingsResponse,
      BlogFaviconSettingsPayload
    >({
      query: ({ favicon, blog_id }) => ({
        url: `/${SEGMENT(blog_id)}`,
        method: "PATCH",
        body: { favicon },
        headers: {
          "Content-type": ContentType.JSON
        }
      })
    })
  })
});
