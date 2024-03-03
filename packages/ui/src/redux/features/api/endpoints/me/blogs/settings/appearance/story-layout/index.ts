import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string =>
  `me/blogs/${id}/settings/appearance/story-layout`;

export interface BlogStoryLayoutSettingsPayload {
  blog_id: string;
  layout: "default" | "minimal";
}

export const {
  useBlogStoryLayoutSettingsMutation: use_blog_story_layout_settings_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    blogStoryLayoutSettings: builder.mutation<
      void,
      BlogStoryLayoutSettingsPayload
    >({
      query: ({ layout, blog_id }) => ({
        url: `/${SEGMENT(blog_id)}`,
        method: "PATCH",
        body: { layout },
        headers: {
          "Content-type": ContentType.JSON
        }
      })
    })
  })
});
