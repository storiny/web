import dynamic from "next/dynamic";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import RightSidebar from "~/layout/RightSidebar";

const SuspendedExploreRightSidebarContent = dynamic(() => import("./content"), {
  loading: () => <SuspenseLoader />
});

const LegalRightSidebar = (): React.ReactElement => (
  <RightSidebar>
    <SuspendedExploreRightSidebarContent />
  </RightSidebar>
);

export default LegalRightSidebar;
