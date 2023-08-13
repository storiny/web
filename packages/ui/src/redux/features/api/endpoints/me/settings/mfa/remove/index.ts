import { ContentType } from "@storiny/shared";
import { Remove2FASchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/credentials/2fa-settings/remove-2fa";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/mfa/remove";

export interface RemoveMFAResponse {}
export type RemoveMFAPayload = Remove2FASchema;

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
