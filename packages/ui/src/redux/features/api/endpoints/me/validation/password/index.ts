import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/validation/password";

export interface PasswordValidationResponse {
  email: string;
}
export interface PasswordValidationPayload {
  password: string;
}

export const { usePasswordValidationMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    passwordValidation: builder.mutation<
      PasswordValidationResponse,
      PasswordValidationPayload
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
