import { ContentType } from "@storiny/shared";
import { SensitiveContentSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/privacy/site-safety/sensitive-content";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/sensitive-content";

export interface SensitiveContentResponse {}
export type SensitiveContentPayload = SensitiveContentSchema;

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
