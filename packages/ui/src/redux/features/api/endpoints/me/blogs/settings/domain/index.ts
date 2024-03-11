import { BlogDomainSettingsSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/blogs/[id_or_slug]/(default-rsb)/advanced/domain/domain.schema";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blogs/${id}/settings/domain`;

export interface BlogDomainSettingsPayload extends BlogDomainSettingsSchema {
  blog_id: string;
}

export const {
  useBlogDomainSettingsMutation: use_blog_domain_settings_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    blogDomainSettings: builder.mutation<void, BlogDomainSettingsPayload>({
      query: ({ blog_id, ...rest }) => ({
        url: `/${SEGMENT(blog_id)}`,
        method: "PATCH",
        body: rest
      })
    })
  })
});
