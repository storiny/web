import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "auth/reset-password";

export interface ResetPasswordResponse {}

export interface ResetPasswordPayload {
  email: string;
  "logout-of-all-devices": boolean;
  password: string;
  token: string;
}

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
