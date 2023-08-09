import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "auth/signup";

export interface SignupResponse {}

export interface SignupPayload {
  email: string;
  name: string;
  password: string;
  username: string;
  wpm: number;
}

export const { useSignupMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation<SignupResponse, SignupPayload>({
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
