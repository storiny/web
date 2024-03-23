import { ContentType } from "@storiny/shared";
import { Blog } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string =>
  `me/blogs/${id}/settings/appearance/mark`;

export type BlogMarkSettingsResponse = Pick<Blog, "mark_light" | "mark_dark">;

export interface BlogMarkSettingsPayload {
  blog_id: string;
  mark_id: string | null;
  type: "dark" | "light";
}

export const { useBlogMarkSettingsMutation: use_blog_mark_settings_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      blogMarkSettings: builder.mutation<
        BlogMarkSettingsResponse,
        BlogMarkSettingsPayload
      >({
        query: ({ mark_id, type, blog_id }) => ({
          url: `/${SEGMENT(blog_id)}`,
          method: "PATCH",
          body: { mark_id, type },
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
