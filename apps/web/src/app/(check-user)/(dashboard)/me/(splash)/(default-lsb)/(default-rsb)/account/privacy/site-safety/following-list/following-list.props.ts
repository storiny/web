import { GetPrivacySettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/form";

import { FollowingListSchema } from "./following-list.schema";

export type FollowingListProps = {
  on_submit?: SubmitHandler<FollowingListSchema>;
} & Pick<GetPrivacySettingsResponse, "following_list_visibility">;
