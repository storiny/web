import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/mfa/remove";

export interface RemoveMFAResponse {}
export interface RemoveMFAPayload {
  code: string;
}

export const { useRemoveMfaMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    removeMfa: builder.mutation<RemoveMFAResponse, RemoveMFAPayload>({
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
