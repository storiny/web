"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "../../../../../../../../../../../packages/ui/src/components/divider";
import Link from "../../../../../../../../../../../packages/ui/src/components/link";
import Spacer from "../../../../../../../../../../../packages/ui/src/components/spacer";
import Typography from "../../../../../../../../../../../packages/ui/src/components/typography";
import TitleBlock from "../../../../../../../../../../../packages/ui/src/entities/title-block";
import { use_media_query } from "../../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";

import DashboardGroup from "../../dashboard-group";
import DashboardTitle from "../../dashboard-title";
import DashboardWrapper from "../../dashboard-wrapper";
import AvatarSettings from "./avatar-settings";
import BannerSettings from "./banner-settings";
import AccountGeneralForm from "./general-form";
import AccountProfileRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";
import UsernameSettings from "./username-settings";

const ProfileSettingsClient = (): React.ReactElement => {
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  return (
    <React.Fragment>
      <main>
        <DashboardTitle>Public profile</DashboardTitle>
        <BannerSettings />
        <DashboardWrapper>
          {is_smaller_than_desktop && (
            <DashboardGroup>
              <Typography as={"h2"} level={"h4"}>
                Avatar
              </Typography>
              <Spacer orientation={"vertical"} size={1.5} />
              <div className={styles["avatar-settings-wrapper"]}>
                <AvatarSettings />
              </div>
            </DashboardGroup>
          )}
          <DashboardGroup>
            <Typography as={"h2"} level={"h4"}>
              General
            </Typography>
            <Spacer orientation={"vertical"} size={1.5} />
            <AccountGeneralForm />
          </DashboardGroup>
          <Divider />
          <DashboardGroup>
            <TitleBlock title={"Username"}>
              Your username is unique to you globally, and changing it will
              break any existing links to your profile. Therefore, we only allow
              changing it once a month.{" "}
              <Link href={"/guides/changing-username"} underline={"always"}>
                Learn more about changing your username
              </Link>
              .
            </TitleBlock>
            <Spacer orientation={"vertical"} size={4.5} />
            <UsernameSettings />
          </DashboardGroup>
          <Divider />
          <DashboardGroup>
            <TitleBlock title={"Connections"}>
              You can add a link to your external social media account on the
              <Link href={"/me/account/connections"}>connections page</Link>,
              and it will be displayed on your public profile.
            </TitleBlock>
          </DashboardGroup>
        </DashboardWrapper>
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <AccountProfileRightSidebar />
    </React.Fragment>
  );
};

export default ProfileSettingsClient;
