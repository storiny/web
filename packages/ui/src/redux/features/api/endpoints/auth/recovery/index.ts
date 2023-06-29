import { ContentType } from "@storiny/shared";

import { ApiQueryBuilder, ApiResponse } from "~/redux/features/api/types";

const SEGMENT = "auth/recovery";

export interface RecoveryResponse extends ApiResponse {}

export interface RecoveryPayload {
  email: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const recovery = (builder: ApiQueryBuilder) =>
  builder.mutation<RecoveryResponse, RecoveryPayload>({
    query: (body) => ({
      url: `/${SEGMENT}`,
      method: "POST",
      body,
      headers: {
        "Content-type": ContentType.JSON,
      },
    }),
  });
