"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/Divider";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import PageTitle from "~/entities/PageTitle";
import TitleBlock from "~/entities/TitleBlock";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import AvatarSettings from "./avatar-settings";
import BannerSettings from "./banner-settings";
import AccountGeneralForm from "./general-form";
import AccountProfileRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";
import UsernameSettings from "./username-settings";

const Page = (): React.ReactElement => {
  const shouldRenderAvatarSettings = useMediaQuery(breakpoints.down("desktop"));
  return (
    <React.Fragment>
      <main>
        <PageTitle dashboard hideBackButton>
          <h1>Public profile</h1>
        </PageTitle>
        <BannerSettings />
        <div className={clsx("flex-col", styles.x, styles.wrapper)}>
          {shouldRenderAvatarSettings && (
            <div className={clsx("flex-col", styles.x, styles.group)}>
              <Typography as={"h2"} level={"h4"}>
                Avatar
              </Typography>
              <div
                className={clsx(styles.x, styles["avatar-settings-wrapper"])}
              >
                <AvatarSettings />
              </div>
            </div>
          )}
          <div className={clsx("flex-col", styles.x, styles.group)}>
            <Typography as={"h2"} level={"h4"}>
              General
            </Typography>
            <AccountGeneralForm />
          </div>
          <Divider />
          <div className={clsx("flex-col", styles.x, styles.group)}>
            <TitleBlock title={"Username"}>
              Your username is unique to you globally, and changing it will
              break any existing links to your profile. Therefore, we only allow
              changing it once a month.{" "}
              <Link href={"/guides/changing-username"} underline={"always"}>
                Learn more about changing your username
              </Link>
              .
            </TitleBlock>
            <Spacer orientation={"vertical"} size={1.5} />
            <UsernameSettings />
          </div>
          <Divider />
          <div className={clsx("flex-col", styles.x, styles.group)}>
            <TitleBlock title={"Connections"}>
              You can add a link to your external social media account on the
              <Link href={"/me/account/connections"}>connections page</Link>,
              and it will be displayed on your public profile.
            </TitleBlock>
          </div>
        </div>
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <AccountProfileRightSidebar />
    </React.Fragment>
  );
};

export default Page;
