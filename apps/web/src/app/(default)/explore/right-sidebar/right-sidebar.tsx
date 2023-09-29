import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import RightSidebar from "../../../../../../../packages/ui/src/layout/right-sidebar";

const SuspendedExploreRightSidebarContent = dynamic(() => import("./content"), {
  loading: dynamicLoader()
});

const LegalRightSidebar = (): React.ReactElement => (
  <RightSidebar>
    <SuspendedExploreRightSidebarContent />
  </RightSidebar>
);

export default LegalRightSidebar;
