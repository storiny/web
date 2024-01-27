import { IncomingCollaborationRequest } from "@storiny/shared";
import { z } from "zod";

export type CollaborationRequestsSchema = z.infer<
  typeof COLLABORATION_REQUESTS_SCHEMA
>;

export const COLLABORATION_REQUESTS_SCHEMA = z.object({
  collaboration_requests: z.enum([
    `${IncomingCollaborationRequest.EVERYONE}`,
    `${IncomingCollaborationRequest.FOLLOWING}`,
    `${IncomingCollaborationRequest.FRIENDS}`,
    `${IncomingCollaborationRequest.NONE}`
  ])
});
