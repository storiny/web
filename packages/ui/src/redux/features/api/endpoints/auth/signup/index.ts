import { ContentType } from "@storiny/shared";

import { ApiQueryBuilder, ApiResponse } from "~/redux/features/api/types";

const SEGMENT = "auth/signup";

export interface SignupResponse extends ApiResponse {}

export interface SignupPayload {
  email: string;
  name: string;
  password: string;
  username: string;
  wpm: number;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const signup = (builder: ApiQueryBuilder) =>
  builder.mutation<SignupResponse, SignupPayload>({
    query: (body) => ({
      url: `/${SEGMENT}`,
      method: "POST",
      body,
      headers: {
        "Content-type": ContentType.JSON,
      },
    }),
  });
