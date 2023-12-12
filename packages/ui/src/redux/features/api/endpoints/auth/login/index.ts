import { ContentType } from "@storiny/shared";
import { LoginSchema } from "@storiny/web/src/app/(auth)/auth/(segmented)/@login/schema";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "auth/login";

export interface LoginResponse {
  is_first_login: boolean;
  result:
    | "success" // Login success
    | "suspended" // Account suspended
    | "held_for_deletion" // User requested deletion
    | "deactivated" // User has deactivated their account
    | "verification_pending"; // Pending email verification
}

export type LoginPayload = LoginSchema & { bypass?: boolean; code?: string };

export const { useLoginMutation: use_login_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      login: builder.mutation<LoginResponse, LoginPayload>({
        query: ({ bypass, ...rest }) => ({
          url: `/${SEGMENT}?bypass=${Boolean(bypass)}`,
          method: "POST",
          body: rest,
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
