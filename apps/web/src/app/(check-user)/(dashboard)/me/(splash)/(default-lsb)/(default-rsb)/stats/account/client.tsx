"use client";

import React from "react";

import Spacer from "~/components/Spacer";
import CustomState from "~/entities/CustomState";

import DashboardTitle from "../../../dashboard-title";

// TODO: Implement

const AccountMetricsClient = (): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle>Account metrics</DashboardTitle>
    <CustomState
      description={"This feature is currently being worked on."}
      title={"Available soon"}
    />
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default AccountMetricsClient;
