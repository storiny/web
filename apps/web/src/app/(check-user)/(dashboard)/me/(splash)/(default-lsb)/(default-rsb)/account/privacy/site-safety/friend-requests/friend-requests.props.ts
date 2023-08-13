import { GetPrivacySettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/Form";

import { FriendRequestsSchema } from "./friend-requests.schema";

export type FriendRequestsProps = {
  onSubmit?: SubmitHandler<FriendRequestsSchema>;
} & Pick<GetPrivacySettingsResponse, "incoming_friend_requests">;
