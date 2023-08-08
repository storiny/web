import dynamic from "next/dynamic";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import LeftSidebar from "~/layout/LeftSidebar";

const SuspendedDashboardLeftSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: () => <SuspenseLoader />
  }
);

const DefaultDashboardLeftSidebar = (): React.ReactElement => (
  <LeftSidebar
    componentProps={{
      wrapper: {
        style: {
          paddingInline: 0,
          paddingBottom: 0
        }
      }
    }}
  >
    <SuspendedDashboardLeftSidebarContent />
  </LeftSidebar>
);

export default DefaultDashboardLeftSidebar;
