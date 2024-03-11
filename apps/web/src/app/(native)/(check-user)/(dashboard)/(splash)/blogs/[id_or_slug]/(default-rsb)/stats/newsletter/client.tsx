"use client";

import React from "react";

import Spacer from "~/components/spacer";
import CustomState from "~/entities/custom-state";

import DashboardTitle from "../../../../../common/dashboard-title";
import DashboardWrapper from "../../../../../common/dashboard-wrapper";

const NewsletterStatsClient = (): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle>Newsletter statistics</DashboardTitle>
    <DashboardWrapper>
      <CustomState
        auto_size
        description={"This feature is currently being worked on."}
        title={"Available soon"}
      />
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default NewsletterStatsClient;
