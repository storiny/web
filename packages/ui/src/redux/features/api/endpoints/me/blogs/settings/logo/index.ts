import { ContentType } from "@storiny/shared";
import { Blog } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blogs/${id}/settings/logo`;

export type BlogLogoSettingsResponse = Pick<Blog, "logo_id" | "logo_hex">;

export interface BlogLogoSettingsPayload {
  blog_id: string;
  logo_id: string | null;
}

export const { useBlogLogoSettingsMutation: use_blog_logo_settings_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      blogLogoSettings: builder.mutation<
        BlogLogoSettingsResponse,
        BlogLogoSettingsPayload
      >({
        query: ({ logo_id, blog_id }) => ({
          url: `/${SEGMENT(blog_id)}`,
          method: "PATCH",
          body: { logo_id },
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
