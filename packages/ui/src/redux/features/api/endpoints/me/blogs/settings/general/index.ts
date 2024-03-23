import { ContentType } from "@storiny/shared";
import { BlogGeneralSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/blogs/[id_or_slug]/settings/general/general-form";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blogs/${id}/settings/general`;

export type BlogGeneralSettingsPayload = BlogGeneralSchema & {
  blog_id: string;
};

export const {
  useBlogGeneralSettingsMutation: use_blog_general_settings_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    blogGeneralSettings: builder.mutation<void, BlogGeneralSettingsPayload>({
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
