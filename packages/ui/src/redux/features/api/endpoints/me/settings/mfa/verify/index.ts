import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/mfa/verify";

export interface VerifyMFAPayload {
  code: string;
}

export const { useVerfyMfaMutation: use_verify_mfa_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      verfyMfa: builder.mutation<void, VerifyMFAPayload>({
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
