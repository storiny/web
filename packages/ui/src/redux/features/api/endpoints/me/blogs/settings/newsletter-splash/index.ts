import { ContentType } from "@storiny/shared";
import { Blog } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string =>
  `me/blogs/${id}/settings/newsletter-splash`;

export type BlogNewsletterSplashSettingsResponse = Pick<
  Blog,
  "newsletter_splash_id" | "newsletter_splash_hex"
>;

export interface BlogNewsletterSplashSettingsPayload {
  blog_id: string;
  newsletter_splash_id: string | null;
}

export const {
  useBlogNewsletterSplashSettingsMutation:
    use_blog_newsletter_splash_settings_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    blogNewsletterSplashSettings: builder.mutation<
      BlogNewsletterSplashSettingsResponse,
      BlogNewsletterSplashSettingsPayload
    >({
      query: ({ newsletter_splash_id, blog_id }) => ({
        url: `/${SEGMENT(blog_id)}`,
        method: "PATCH",
        body: { newsletter_splash_id },
        headers: {
          "Content-type": ContentType.JSON
        }
      })
    })
  })
});
