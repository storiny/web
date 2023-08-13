import { GetPrivacySettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/Form";

import { FriendListSchema } from "./friend-list.schema";

export type FriendListProps = {
  onSubmit?: SubmitHandler<FriendListSchema>;
} & Pick<GetPrivacySettingsResponse, "friend_list_visibility">;
