import { ContentType } from "@storiny/shared";
import { RecoverySchema } from "@storiny/web/src/app/(auth)/auth/(segmented)/@recovery_base/schema";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "auth/recovery";

export interface RecoveryResponse {}
export type RecoveryPayload = RecoverySchema;

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
