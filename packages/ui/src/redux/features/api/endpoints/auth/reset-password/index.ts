import { ContentType } from "@storiny/shared";

import { ApiQueryBuilder, ApiResponse } from "~/redux/features/api/types";

const SEGMENT = "auth/reset-password";

export interface ResetPasswordResponse extends ApiResponse {}

export interface ResetPasswordPayload {
  email: string;
  "logout-of-all-devices": boolean;
  password: string;
  token: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const resetPassword = (builder: ApiQueryBuilder) =>
  builder.mutation<ResetPasswordResponse, ResetPasswordPayload>({
    query: (body) => ({
      url: `/${SEGMENT}`,
      method: "POST",
      body,
      headers: {
        "Content-type": ContentType.JSON,
      },
    }),
  });
