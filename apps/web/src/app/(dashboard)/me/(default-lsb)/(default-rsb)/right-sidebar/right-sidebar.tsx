import dynamic from "next/dynamic";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import RightSidebar from "~/layout/RightSidebar";

const SuspendedDashboardRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: () => <SuspenseLoader />
  }
);

const DefaultDashboardRightSidebar = (): React.ReactElement => (
  <RightSidebar hideFooter>
    <SuspendedDashboardRightSidebarContent />
  </RightSidebar>
);

export default DefaultDashboardRightSidebar;
