import { GetPrivacySettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/form";

import { CollaborationRequestsSchema } from "./collaboration-requests.schema";

export type CollaborationRequestsProps = {
  on_submit?: SubmitHandler<CollaborationRequestsSchema>;
} & Pick<GetPrivacySettingsResponse, "incoming_collaboration_requests">;
