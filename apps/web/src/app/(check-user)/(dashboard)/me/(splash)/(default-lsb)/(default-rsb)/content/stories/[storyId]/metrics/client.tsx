"use client";

import React from "react";

import Spacer from "~/components/Spacer";
import CustomState from "~/entities/CustomState";

import DashboardTitle from "../../../../../dashboard-title";
import DashboardWrapper from "../../../../../dashboard-wrapper";

// TODO: Implement

const ContentStoryMetricsClient = (): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle
      backButtonHref={"/me/content/stories"}
      hideBackButton={false}
    >
      Story responses
    </DashboardTitle>
    <DashboardWrapper>
      <CustomState
        description={"This feature is currently being worked on."}
        title={"Available soon"}
      />
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default ContentStoryMetricsClient;
