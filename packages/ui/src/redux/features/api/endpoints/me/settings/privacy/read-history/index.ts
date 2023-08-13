import { ContentType } from "@storiny/shared";
import { AccountHistorySchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/privacy/site-safety/account-history";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/read-history";

export interface ReadHistoryResponse {}
export type ReadHistoryPayload = AccountHistorySchema;

export const { useReadHistoryMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    readHistory: builder.mutation<ReadHistoryResponse, ReadHistoryPayload>({
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
