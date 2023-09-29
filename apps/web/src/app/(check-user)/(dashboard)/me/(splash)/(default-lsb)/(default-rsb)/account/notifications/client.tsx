"use client";

import React from "react";

import Divider from "../../../../../../../../../../../../packages/ui/src/components/divider";
import Spacer from "../../../../../../../../../../../../packages/ui/src/components/spacer";

import DashboardTitle from "../../../dashboard-title";
import DashboardWrapper from "../../../dashboard-wrapper";
import MailNotifications from "./mail-notifications";
import { NotificationsProps } from "./notifications.props";
import SiteNotifications from "./site-notifications";

const PrivacyClient = ({
  mail_features_and_updates,
  mail_newsletters,
  mail_login_activity,
  mail_digest,
  features_and_updates,
  replies,
  friend_requests,
  tags,
  stories,
  comments,
  new_followers
}: NotificationsProps): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle>Notifications</DashboardTitle>
    <DashboardWrapper>
      <SiteNotifications
        {...{
          features_and_updates,
          replies,
          friend_requests,
          tags,
          stories,
          comments,
          new_followers
        }}
      />
      <Divider />
      <MailNotifications
        {...{
          mail_features_and_updates,
          mail_newsletters,
          mail_login_activity,
          mail_digest
        }}
      />
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default PrivacyClient;
