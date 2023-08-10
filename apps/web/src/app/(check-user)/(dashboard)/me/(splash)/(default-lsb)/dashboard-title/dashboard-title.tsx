import React from "react";

import PageTitle from "~/entities/PageTitle";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import { DashboardTitleProps } from "./dashboard-title.props";

const DashboardTitle = (props: DashboardTitleProps): React.ReactElement => {
  const { children, ...rest } = props;
  const isSmallerThanDesktop = useMediaQuery(breakpoints.down("desktop"));

  return (
    <PageTitle
      backButtonHref={"/me"}
      dashboard
      hideBackButton={!isSmallerThanDesktop}
      {...rest}
    >
      <h1>{children}</h1>
    </PageTitle>
  );
};

export default DashboardTitle;
