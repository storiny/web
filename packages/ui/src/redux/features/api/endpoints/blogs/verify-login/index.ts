import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string => `blogs/${blog_id}/verify-login`;

export interface VerifyBlogLoginResponse {
  result:
    | "success" // Login success
    | "invalid_token"; // Login token is invalid
}

export interface VerifyBlogLoginPayload {
  blog_id: string;
  token: string;
}

export const { useVerifyBlogLoginMutation: use_verify_blog_login_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      verifyBlogLogin: builder.mutation<
        VerifyBlogLoginResponse,
        VerifyBlogLoginPayload
      >({
        query: ({ blog_id, token }) => ({
          url: `/${SEGMENT(blog_id)}`,
          method: "POST",
          body: { token },
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
