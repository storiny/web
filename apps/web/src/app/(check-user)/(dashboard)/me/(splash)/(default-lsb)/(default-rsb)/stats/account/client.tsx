"use client";

import React from "react";

import Spacer from "../../../../../../../../../../../../packages/ui/src/components/spacer";
import CustomState from "../../../../../../../../../../../../packages/ui/src/entities/custom-state";

import DashboardTitle from "../../../dashboard-title";
import DashboardWrapper from "../../../dashboard-wrapper";

// TODO: Implement

const AccountMetricsClient = (): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle>Account metrics</DashboardTitle>
    <DashboardWrapper>
      <CustomState
        description={"This feature is currently being worked on."}
        title={"Available soon"}
      />
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default AccountMetricsClient;
