import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "auth/signup";

export interface SignupPayload {
  email: string;
  name: string;
  password: string;
  username: string;
  wpm: number;
}

export const { use_signupMutation: use_signup_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      signup: builder.mutation<void, SignupPayload>({
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
