import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/sensitive-content";

export interface SensitiveContentResponse {}
export interface SensitiveContentPayload {
  "sensitive-content": boolean;
}

export const { useSensitiveContentMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sensitiveContent: builder.mutation<
      SensitiveContentResponse,
      SensitiveContentPayload
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
