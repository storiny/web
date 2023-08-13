import { GetPrivacySettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/Form";

import { FollowingListSchema } from "./following-list.schema";

export type FollowingListProps = {
  onSubmit?: SubmitHandler<FollowingListSchema>;
} & Pick<GetPrivacySettingsResponse, "following_list_visibility">;
