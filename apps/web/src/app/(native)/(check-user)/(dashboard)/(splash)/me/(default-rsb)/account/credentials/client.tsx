"use client";

import React from "react";

import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";

import DashboardGroup from "../../../../common/dashboard-group";
import DashboardTitle from "../../../../common/dashboard-title";
import DashboardWrapper from "../../../../common/dashboard-wrapper";
import CredentialsTwoFactorAuthSettings from "./2fa-settings";
import CredentialsConnectedAccountsGroup from "./connected-accounts-group";
import { CredentialsProps } from "./credentials.props";
import CredentialsEmailGroup from "./email-group";
import CredentialsPasswordSettings from "./password-settings";

const CredentialsClient = (props: CredentialsProps): React.ReactElement => {
  const { mfa_enabled, login_google_id, login_apple_id, has_password } = props;
  return (
    <React.Fragment>
      <DashboardTitle>Credentials</DashboardTitle>
      <DashboardWrapper>
        <CredentialsEmailGroup has_password={has_password} />
        <Divider />
        <DashboardGroup>
          <Typography as={"h2"} level={"h4"}>
            Authentication
          </Typography>
          <Spacer orientation={"vertical"} size={3} />
          <CredentialsPasswordSettings has_password={has_password} />
          <Spacer orientation={"vertical"} size={5} />
          <CredentialsTwoFactorAuthSettings
            has_password={has_password}
            mfa_enabled={mfa_enabled}
          />
        </DashboardGroup>
        <Divider />
        <CredentialsConnectedAccountsGroup
          has_password={has_password}
          login_apple_id={login_apple_id}
          login_google_id={login_google_id}
        />
      </DashboardWrapper>
      <Spacer orientation={"vertical"} size={10} />
    </React.Fragment>
  );
};

export default CredentialsClient;
