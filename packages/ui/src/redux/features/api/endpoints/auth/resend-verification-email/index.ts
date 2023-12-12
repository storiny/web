import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "auth/resend-verification-email";

export type ResendVerificationEmailPayload = { email: string };

export const {
  useResendVerificationEmailMutation: use_resend_verification_email_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    resendVerificationEmail: builder.mutation<
      void,
      ResendVerificationEmailPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT}`,
        method: "POST",
        body,
        headers: {
          "Content-type": ContentType.JSON
        }
      })
    })
  })
});
