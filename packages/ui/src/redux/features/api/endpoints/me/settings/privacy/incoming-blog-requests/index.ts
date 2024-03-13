import { ContentType } from "@storiny/shared";
import { BlogRequestsSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/account/privacy/site-safety/blog-requests";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/incoming-blog-requests";

export type IncomingBlogRequestsPayload = BlogRequestsSchema;

export const {
  useIncomingBlogRequestsMutation: use_incoming_blog_requests_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    incomingBlogRequests: builder.mutation<void, IncomingBlogRequestsPayload>({
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
