import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "public/validation/username";

export interface UsernameValidationResponse {}
export interface UsernameValidationPayload {
  username: string;
}

export const { useUsernameValidationMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    usernameValidation: builder.mutation<
      UsernameValidationResponse,
      UsernameValidationPayload
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
