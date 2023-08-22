import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import RightSidebar from "~/layout/RightSidebar";

const SuspendedExploreRightSidebarContent = dynamic(() => import("./content"), {
  loading: dynamicLoader()
});

const LegalRightSidebar = (): React.ReactElement => (
  <RightSidebar>
    <SuspendedExploreRightSidebarContent />
  </RightSidebar>
);

export default LegalRightSidebar;
