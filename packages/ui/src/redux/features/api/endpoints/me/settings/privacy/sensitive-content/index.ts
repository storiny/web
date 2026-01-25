import { ContentType } from "@storiny/shared";
import { SensitiveContentSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/account/privacy/site-safety/sensitive-content";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/sensitive-content";

export type SensitiveContentPayload = SensitiveContentSchema;

export const { useSensitiveContentMutation: use_sensitive_content_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      sensitiveContent: builder.mutation<void, SensitiveContentPayload>({
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
