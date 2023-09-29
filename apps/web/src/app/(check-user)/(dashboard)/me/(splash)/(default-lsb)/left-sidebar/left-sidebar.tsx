import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import LeftSidebar from "../../../../../../../../../../packages/ui/src/layout/left-sidebar";

const SuspendedDashboardLeftSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamicLoader()
  }
);

const DefaultDashboardLeftSidebar = (): React.ReactElement => (
  <LeftSidebar
    component_props={{
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
