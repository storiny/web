"use client";

import React from "react";

import Spacer from "~/components/spacer";
import CustomState from "~/entities/custom-state";

import DashboardTitle from "../../../../../dashboard-title";
import DashboardWrapper from "../../../../../dashboard-wrapper";

// TODO: Implement

const ContentStoryMetricsClient = (): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle
      back_button_href={"/me/content/stories"}
      hide_back_button={false}
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
