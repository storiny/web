import { ContentType } from "@storiny/shared";
import { DisableAccountSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/privacy/site-safety/account-removal/disable-account";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/disable-account";

export interface DisableAccountResponse {}
export type DisableAccountPayload = DisableAccountSchema;

export const { useDisableAccountMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    disableAccount: builder.mutation<
      DisableAccountResponse,
      DisableAccountPayload
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
