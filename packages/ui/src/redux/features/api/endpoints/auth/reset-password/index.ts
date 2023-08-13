import { ContentType } from "@storiny/shared";
import { ResetSchema } from "@storiny/web/src/app/(auth)/auth/(segmented)/@reset_base/schema";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "auth/reset-password";

export interface ResetPasswordResponse {}
export type ResetPasswordPayload = ResetSchema & {
  token: string;
};

export const { useResetPasswordMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    resetPassword: builder.mutation<
      ResetPasswordResponse,
      ResetPasswordPayload
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
