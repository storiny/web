import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string =>
  `me/blogs/${id}/settings/appearance/page-layout`;

export interface BlogPageLayoutSettingsPayload {
  blog_id: string;
  layout: "default" | "large";
}

export const {
  useBlogPageLayoutSettingsMutation: use_blog_page_layout_settings_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    blogPageLayoutSettings: builder.mutation<
      void,
      BlogPageLayoutSettingsPayload
    >({
      query: ({ layout, blog_id }) => ({
        url: `/${SEGMENT(blog_id)}`,
        method: "PATCH",
        body: { is_homepage_large_layout: layout === "large" },
        headers: {
          "Content-type": ContentType.JSON
        }
      })
    })
  })
});
