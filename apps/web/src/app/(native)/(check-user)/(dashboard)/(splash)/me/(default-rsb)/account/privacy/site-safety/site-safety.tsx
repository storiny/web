import React from "react";

import Divider from "~/components/divider";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import TitleBlock from "~/entities/title-block";

import DashboardGroup from "../../../../../common/dashboard-group";
import AccountHistory from "./account-history";
import AccountRemovalGroup from "./account-removal";
import CollaborationRequests from "./collaboration-requests";
import ExportDataGroup from "./export-data-group";
import FollowingList from "./following-list";
import FriendList from "./friend-list";
import FriendRequests from "./friend-requests";
import PrivateAccount from "./private-account";
import SensitiveContent from "./sensitive-content";
import { SiteSafetyProps } from "./site-safety.props";

const SiteSafety = ({
  is_private_account,
  record_read_history,
  following_list_visibility,
  friend_list_visibility,
  incoming_friend_requests,
  incoming_collaboration_requests,
  allow_sensitive_media
}: SiteSafetyProps): React.ReactElement => (
  <React.Fragment>
    <DashboardGroup>
      <Typography as={"h2"} level={"h4"}>
        Site safety
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      <PrivateAccount is_private_account={is_private_account} />
      <Spacer orientation={"vertical"} size={3.5} />
      <AccountHistory record_read_history={record_read_history} />
      <Spacer orientation={"vertical"} size={3.5} />
      <FriendRequests incoming_friend_requests={incoming_friend_requests} />
      <Spacer orientation={"vertical"} size={3.5} />
      <CollaborationRequests
        incoming_collaboration_requests={incoming_collaboration_requests}
      />
      <Spacer orientation={"vertical"} size={3.5} />
      <FollowingList following_list_visibility={following_list_visibility} />
      <Spacer orientation={"vertical"} size={3.5} />
      <FriendList friend_list_visibility={friend_list_visibility} />
      <Spacer orientation={"vertical"} size={3.5} />
      <SensitiveContent allow_sensitive_media={allow_sensitive_media} />
    </DashboardGroup>
    <Divider />
    <ExportDataGroup />
    <Divider />
    <AccountRemovalGroup />
    <Divider />
    <DashboardGroup>
      <TitleBlock title={"About your privacy"}>
        Kindly read our{" "}
        <Link href={"/terms"} target={"_blank"} underline={"always"}>
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href={"/privacy"} target={"_blank"} underline={"always"}>
          Privacy Policy
        </Link>{" "}
        to learn about how we collect, store, and utilize the information you
        provide to us.
      </TitleBlock>
    </DashboardGroup>
  </React.Fragment>
);

export default SiteSafety;
