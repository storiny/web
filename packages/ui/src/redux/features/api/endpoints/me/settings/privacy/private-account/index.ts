import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/private-account";

export interface PrivateAccountResponse {}
export interface PrivateAccountPayload {
  "private-account": boolean;
}

export const { usePrivateAccountMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    privateAccount: builder.mutation<
      PrivateAccountResponse,
      PrivateAccountPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT}`,
        method: "PATCH",
        body,
        headers: {
          "Content-type": ContentType.JSON
        }
      })
    })
  })
});
