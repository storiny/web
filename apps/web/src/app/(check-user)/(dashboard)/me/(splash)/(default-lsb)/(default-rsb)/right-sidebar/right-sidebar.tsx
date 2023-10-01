import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { use_media_query } from "~/hooks/use-media-query";
import RightSidebar from "~/layout/right-sidebar";
import { BREAKPOINTS } from "~/theme/breakpoints";

const SuspendedDashboardRightSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamic_loader()
  }
);

const DefaultDashboardRightSidebar = (): React.ReactElement | null => {
  const should_render = use_media_query(BREAKPOINTS.up("desktop"));

  if (!should_render) {
    return null;
  }

  return (
    <RightSidebar>
      <SuspendedDashboardRightSidebarContent />
    </RightSidebar>
  );
};

export default DefaultDashboardRightSidebar;
