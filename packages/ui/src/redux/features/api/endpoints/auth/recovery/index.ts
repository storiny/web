import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "auth/recovery";

export interface RecoveryResponse {}

export interface RecoveryPayload {
  email: string;
}

export const { useRecoveryMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    recovery: builder.mutation<RecoveryResponse, RecoveryPayload>({
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
