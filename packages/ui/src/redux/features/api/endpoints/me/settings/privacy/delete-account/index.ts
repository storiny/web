import { ContentType } from "@storiny/shared";
import { DeleteAccountSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/privacy/site-safety/account-removal/delete-account";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/delete-account";

export interface DeleteAccountResponse {}
export type DeleteAccountPayload = DeleteAccountSchema;

export const { useDeleteAccountMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    deleteAccount: builder.mutation<
      DeleteAccountResponse,
      DeleteAccountPayload
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
