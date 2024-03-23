import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string =>
  `me/blogs/${id}/settings/appearance/branding`;

export interface BlogBrandingSettingsPayload {
  blog_id: string;
  hide_storiny_branding: boolean;
}

export const {
  useBlogBrandingSettingsMutation: use_blog_branding_settings_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    blogBrandingSettings: builder.mutation<void, BlogBrandingSettingsPayload>({
      query: ({ blog_id, ...body }) => ({
        url: `/${SEGMENT(blog_id)}`,
        method: "PATCH",
        body,
        headers: {
          "Content-type": ContentType.JSON
        }
      })
    })
  })
});
