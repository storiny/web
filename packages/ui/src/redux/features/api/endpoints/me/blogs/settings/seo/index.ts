import { BlogSEOSettingsSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/blogs/[identifier]/(default-rsb)/advanced/seo/seo.schema";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blogs/${id}/settings/seo`;

export interface BlogSEOSettingsPayload extends BlogSEOSettingsSchema {
  blog_id: string;
}

export const { useBlogSEOSettingsMutation: use_blog_seo_settings_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      blogSEOSettings: builder.mutation<void, BlogSEOSettingsPayload>({
        query: ({ blog_id, ...rest }) => ({
          url: `/${SEGMENT(blog_id)}`,
          method: "PATCH",
          body: rest
        })
      })
    })
  });
