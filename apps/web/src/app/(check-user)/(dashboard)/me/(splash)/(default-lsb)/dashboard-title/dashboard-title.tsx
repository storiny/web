import React from "react";

import PageTitle from "~/entities/page-title";
import css from "~/theme/main.module.scss";

import { DashboardTitleProps } from "./dashboard-title.props";

const DashboardTitle = (props: DashboardTitleProps): React.ReactElement => {
  const { children, ...rest } = props;
  return (
    <PageTitle
      back_button_href={"/me"}
      dashboard
      hide_back_button_on_desktop
      {...rest}
    >
      <h1 className={css.ellipsis}>{children}</h1>
    </PageTitle>
  );
};

export default DashboardTitle;
