import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "auth/login";

export interface LoginResponse extends ApiResponse {
  result:
    | "success" // Login success
    | "suspended" // Account suspended
    | "held_for_deletion" // User requested deletion
    | "verification_pending"; // Pending email verification
}

export interface LoginPayload {
  email: string;
  password: string;
  "remember-me": boolean;
}

export const { useLoginMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginPayload>({
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
