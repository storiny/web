import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string =>
  `me/blogs/${blog_id}/settings/domain/code-request`;

export interface RequestBlogDomainVerificationRequest {
  blog_id: string;
  domain: string;
}

export interface RequestBlogDomainVerificationResponse {
  code: string;
}

export const {
  useRequestBlogDomainVerificationCodeMutation:
    use_request_blog_domain_verification_code_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    requestBlogDomainVerificationCode: builder.mutation<
      RequestBlogDomainVerificationResponse,
      RequestBlogDomainVerificationRequest
    >({
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
