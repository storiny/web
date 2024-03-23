"use client";

import React from "react";

import { GetPrivacySettingsResponse } from "~/common/grpc";
import Spacer from "~/components/spacer";

import DashboardTitle from "../../../../common/dashboard-title";
import DashboardWrapper from "../../../../common/dashboard-wrapper";
import SiteSafety from "./site-safety";

type Props = GetPrivacySettingsResponse;

const PrivacyClient = (props: Props): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle>Privacy & safety</DashboardTitle>
    <DashboardWrapper>
      <SiteSafety {...props} />
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default PrivacyClient;
