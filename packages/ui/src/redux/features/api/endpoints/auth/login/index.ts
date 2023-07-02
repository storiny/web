import { ContentType } from "@storiny/shared";

import { ApiQueryBuilder, ApiResponse } from "~/redux/features/api/types";

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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const login = (builder: ApiQueryBuilder) =>
  builder.mutation<LoginResponse, LoginPayload>({
    query: (body) => ({
      url: `/${SEGMENT}`,
      method: "POST",
      body,
      headers: {
        "Content-type": ContentType.JSON
      }
    })
  });
