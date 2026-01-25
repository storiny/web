import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string =>
  `me/blogs/${id}/settings/appearance/theme`;

export interface BlogThemeSettingsPayload {
  blog_id: string;
  default_theme: "light" | "dark" | null;
  force: boolean;
}

export const {
  useBlogThemeSettingsMutation: use_blog_theme_settings_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    blogThemeSettings: builder.mutation<void, BlogThemeSettingsPayload>({
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
