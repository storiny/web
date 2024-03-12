"use client";

import React from "react";

import Divider from "~/components/divider";
import Spacer from "~/components/spacer";

import DashboardTitle from "../../../../common/dashboard-title";
import DashboardWrapper from "../../../../common/dashboard-wrapper";
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
  collaboration_requests,
  blog_requests,
  tags,
  stories,
  story_likes,
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
          collaboration_requests,
          blog_requests,
          tags,
          stories,
          story_likes,
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
