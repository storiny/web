import React from "react";

import PageTitle from "../../../../../../../../../../packages/ui/src/entities/page-title";
import { use_media_query } from "../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { DashboardTitleProps } from "./dashboard-title.props";

const DashboardTitle = (props: DashboardTitleProps): React.ReactElement => {
  const { children, ...rest } = props;
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));

  return (
    <PageTitle
      back_button_href={"/me"}
      dashboard
      hide_back_button={!is_smaller_than_desktop}
      {...rest}
    >
      <h1>{children}</h1>
    </PageTitle>
  );
};

export default DashboardTitle;
