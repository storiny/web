import { ContentType } from "@storiny/shared";
import { PrivateAccountSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/privacy/site-safety/private-account";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/private-account";

export interface PrivateAccountResponse {}
export type PrivateAccountPayload = PrivateAccountSchema;

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
