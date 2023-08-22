"use client";

import React from "react";

import Spacer from "~/components/Spacer";
import CustomState from "~/entities/CustomState";

import DashboardTitle from "../../../dashboard-title";
import DashboardWrapper from "../../../dashboard-wrapper";

// TODO: Implement

const StoriesMetricsClient = (): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle>Stories metrics</DashboardTitle>
    <DashboardWrapper>
      <CustomState
        description={"This feature is currently being worked on."}
        title={"Available soon"}
      />
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default StoriesMetricsClient;
