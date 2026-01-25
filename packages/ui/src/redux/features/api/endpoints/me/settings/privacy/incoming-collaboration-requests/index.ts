import { ContentType } from "@storiny/shared";
import { CollaborationRequestsSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/account/privacy/site-safety/collaboration-requests";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/incoming-collaboration-requests";

export type IncomingCollaborationRequestsPayload = CollaborationRequestsSchema;

export const {
  useIncomingCollaborationRequestsMutation:
    use_incoming_collaboration_requests_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    incomingCollaborationRequests: builder.mutation<
      void,
      IncomingCollaborationRequestsPayload
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
