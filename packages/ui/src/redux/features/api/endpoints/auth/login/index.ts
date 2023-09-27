import { ContentType } from "@storiny/shared";
import { LoginSchema } from "@storiny/web/src/app/(auth)/auth/(segmented)/@login/schema";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "auth/login";

export interface LoginResponse {
  result:
    | "success" // Login success
    | "suspended" // Account suspended
    | "held_for_deletion" // User requested deletion
    | "verification_pending"; // Pending email verification
}

export type LoginPayload = LoginSchema;

export const { useLoginMutation: use_login_mutation } =
  api_slice.injectEndpoints({
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
