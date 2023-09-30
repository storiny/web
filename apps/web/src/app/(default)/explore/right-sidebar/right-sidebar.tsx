import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import RightSidebar from "../../../../../../../packages/ui/src/layout/right-sidebar";

const SuspendedExploreRightSidebarContent = dynamic(() => import("./content"), {
  loading: dynamic_loader()
});

const LegalRightSidebar = (): React.ReactElement => (
  <RightSidebar>
    <SuspendedExploreRightSidebarContent />
  </RightSidebar>
);

export default LegalRightSidebar;
