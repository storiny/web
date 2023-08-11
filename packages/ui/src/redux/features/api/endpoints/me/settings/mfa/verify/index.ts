import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/mfa/verify";

export interface VerifyMFAResponse {}
export interface VerifyMFAPayload {
  code: string;
}

export const { useVerfyMfaMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    verfyMfa: builder.mutation<VerifyMFAResponse, VerifyMFAPayload>({
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
