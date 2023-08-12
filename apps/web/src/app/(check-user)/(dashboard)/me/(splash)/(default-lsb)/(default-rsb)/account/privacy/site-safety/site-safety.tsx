import React from "react";

import { GetPrivacySettingsResponse } from "~/common/grpc";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

import DashboardGroup from "../../../../dashboard-group";
import AccountHistory from "./account-history";
import FriendRequests from "./friend-requests";
import PrivateAccount from "./private-account";
import SensitiveContent from "./sensitive-content";

type Props = GetPrivacySettingsResponse;

const SiteSafety = ({
  is_private_account,
  record_read_history,
  following_list_visibility,
  friends_list_visibility,
  incoming_friend_requests,
  allow_sensitive_media
}: Props): React.ReactElement => (
  <DashboardGroup>
    <Typography as={"h2"} level={"h4"}>
      Site safety
    </Typography>
    <Spacer orientation={"vertical"} size={3} />
    <PrivateAccount is_private_account={is_private_account} />
    <Spacer orientation={"vertical"} size={3.5} />
    <AccountHistory record_read_history={record_read_history} />
    <Spacer orientation={"vertical"} size={3.5} />
    <SensitiveContent allow_sensitive_media={allow_sensitive_media} />
    <Spacer orientation={"vertical"} size={3.5} />
    <FriendRequests friends_list_visibility={friends_list_visibility} />
  </DashboardGroup>
);

export default SiteSafety;
