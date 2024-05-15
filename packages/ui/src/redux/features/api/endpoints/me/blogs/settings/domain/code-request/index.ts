import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string =>
  `me/blogs/${blog_id}/settings/domain/code-request`;

export interface RequestBlogDomainVerificationRequest {
  blog_id: string;
}

export interface RequestBlogDomainVerificationResponse {
  code: string;
}

export const {
  useRequestBlogDomainVerificationCodeMutation:
    use_request_blog_domain_verification_code_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    requestBlogDomainVerificationCode: builder.mutation<
      RequestBlogDomainVerificationResponse,
      RequestBlogDomainVerificationRequest
    >({
      query: ({ blog_id }) => ({
        url: `/${SEGMENT(blog_id)}`,
        method: "POST"
      })
    })
  })
});
