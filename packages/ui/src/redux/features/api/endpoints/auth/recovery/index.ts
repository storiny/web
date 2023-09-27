import { ContentType } from "@storiny/shared";
import { RecoverySchema } from "@storiny/web/src/app/(auth)/auth/(segmented)/@recovery_base/schema";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "auth/recovery";

export type RecoveryPayload = RecoverySchema;

export const { useRecoveryMutation: use_recovery_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      recovery: builder.mutation<void, RecoveryPayload>({
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
