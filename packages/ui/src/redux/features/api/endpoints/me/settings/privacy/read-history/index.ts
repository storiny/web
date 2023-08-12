import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/read-history";

export interface ReadHistoryResponse {}
export interface ReadHistoryPayload {
  "read-history": boolean;
}

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
