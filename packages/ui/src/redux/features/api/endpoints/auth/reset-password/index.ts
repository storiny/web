import { ContentType } from "@storiny/shared";
import { ResetSchema } from "@storiny/web/src/app/(auth)/auth/(segmented)/@reset_base/schema";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "auth/reset-password";

export type ResetPasswordPayload = ResetSchema & {
  token: string;
};

export const { useResetPasswordMutation: use_reset_password_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      resetPassword: builder.mutation<void, ResetPasswordPayload>({
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
