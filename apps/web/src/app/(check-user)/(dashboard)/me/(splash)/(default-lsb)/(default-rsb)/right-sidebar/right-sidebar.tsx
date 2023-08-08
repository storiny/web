import dynamic from "next/dynamic";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import RightSidebar from "~/layout/RightSidebar";
import { breakpoints } from "~/theme/breakpoints";

const SuspendedDashboardRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: () => <SuspenseLoader />
  }
);

const DefaultDashboardRightSidebar = (): React.ReactElement | null => {
  const shouldRender = useMediaQuery(breakpoints.up("desktop"));

  if (!shouldRender) {
    return null;
  }

  return (
    <RightSidebar>
      <SuspendedDashboardRightSidebarContent />
    </RightSidebar>
  );
};

export default DefaultDashboardRightSidebar;
