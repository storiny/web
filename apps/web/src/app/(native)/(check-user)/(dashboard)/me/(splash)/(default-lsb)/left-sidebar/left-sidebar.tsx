import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import LeftSidebar from "~/layout/left-sidebar";

const SuspendedDashboardLeftSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamic_loader()
  }
);

const DefaultDashboardLeftSidebar = (): React.ReactElement => (
  <LeftSidebar
    component_props={{
      wrapper: {
        style: {
          // eslint-disable-next-line prefer-snakecase/prefer-snakecase
          paddingInline: 0,
          // eslint-disable-next-line prefer-snakecase/prefer-snakecase
          paddingBottom: 0
        }
      }
    }}
  >
    <SuspendedDashboardLeftSidebarContent />
  </LeftSidebar>
);

export default DefaultDashboardLeftSidebar;
