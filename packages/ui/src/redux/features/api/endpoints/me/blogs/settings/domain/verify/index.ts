import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string =>
  `me/blogs/${blog_id}/settings/domain`;

export interface VerifyBlogDomainPayload {
  blog_id: string;
  domain: string;
}

export const { useVerifyBlogDomainMutation: use_verify_blog_domain_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      verifyBlogDomain: builder.mutation<void, VerifyBlogDomainPayload>({
        query: ({ blog_id, domain }) => ({
          url: `/${SEGMENT(blog_id)}`,
          method: "POST",
          body: { domain },
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
