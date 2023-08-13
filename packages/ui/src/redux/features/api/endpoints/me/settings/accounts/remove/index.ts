import { ContentType } from "@storiny/shared";
import { RemoveAccountSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/credentials/connected-accounts-group/remove-account";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/accounts/remove";

export interface RemoveAccountResponse {}
export type RemoveAccountPayload = RemoveAccountSchema & {
  vendor: "apple" | "google";
};

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
