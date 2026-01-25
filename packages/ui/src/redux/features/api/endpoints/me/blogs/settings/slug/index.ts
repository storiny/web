import { BlogSlugSettingsSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/blogs/[identifier]/(default-rsb)/advanced/domain/domain.schema";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blogs/${id}/settings/slug`;

export interface BlogDomainSettingsPayload extends BlogSlugSettingsSchema {
  blog_id: string;
}

export const { useBlogSlugSettingsMutation: use_blog_slug_settings_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      blogSlugSettings: builder.mutation<void, BlogDomainSettingsPayload>({
        query: ({ blog_id, ...rest }) => ({
          url: `/${SEGMENT(blog_id)}`,
          method: "PATCH",
          body: rest
        })
      })
    })
  });
