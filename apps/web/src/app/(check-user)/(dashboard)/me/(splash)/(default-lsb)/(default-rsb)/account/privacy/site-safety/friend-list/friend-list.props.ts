import { GetPrivacySettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/form";

import { FriendListSchema } from "./friend-list.schema";

export type FriendListProps = {
  on_submit?: SubmitHandler<FriendListSchema>;
} & Pick<GetPrivacySettingsResponse, "friend_list_visibility">;
