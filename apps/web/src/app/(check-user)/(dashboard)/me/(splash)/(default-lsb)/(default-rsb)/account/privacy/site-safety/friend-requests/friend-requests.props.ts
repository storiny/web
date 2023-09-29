import { GetPrivacySettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "../../../../../../../../../../../../../../packages/ui/src/components/form";

import { FriendRequestsSchema } from "./friend-requests.schema";

export type FriendRequestsProps = {
  on_submit?: SubmitHandler<FriendRequestsSchema>;
} & Pick<GetPrivacySettingsResponse, "incoming_friend_requests">;
