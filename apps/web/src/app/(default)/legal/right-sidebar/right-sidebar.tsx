import dynamic from "next/dynamic";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import RightSidebar from "~/layout/RightSidebar";

const SuspendedLegalRightSidebarContent = dynamic(() => import("./content"), {
  loading: () => <SuspenseLoader />,
});

const LegalRightSidebar = (): React.ReactElement => (
  <RightSidebar hideFooter>
    <SuspendedLegalRightSidebarContent />
  </RightSidebar>
);

export default LegalRightSidebar;
