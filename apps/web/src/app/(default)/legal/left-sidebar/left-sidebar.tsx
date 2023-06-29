import dynamic from "next/dynamic";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import LeftSidebar from "~/layout/LeftSidebar";

const SuspendedLegalLeftSidebarContent = dynamic(() => import("./content"), {
  loading: () => <SuspenseLoader />,
});

const LegalLeftSidebar = (): React.ReactElement => (
  <LeftSidebar
    componentProps={{
      wrapper: {
        style: {
          padding: 0,
        },
      },
    }}
  >
    <SuspendedLegalLeftSidebarContent />
  </LeftSidebar>
);

export default LegalLeftSidebar;
