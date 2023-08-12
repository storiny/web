import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/accounts/remove";

export interface RemoveAccountResponse {}
export interface RemoveAccountPayload {
  "current-password": string;
  vendor: "apple" | "google";
}

export const { useRemoveAccountMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    removeAccount: builder.mutation<
      RemoveAccountResponse,
      RemoveAccountPayload
    >({
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
