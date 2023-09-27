import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import LeftSidebar from "~/layout/LeftSidebar";

const SuspendedLegalLeftSidebarContent = dynamic(() => import("./content"), {
  loading: dynamicLoader()
});

const LegalLeftSidebar = (): React.ReactElement => (
  <LeftSidebar
    component_props={{
      wrapper: {
        style: {
          padding: 0
        }
      }
    }}
  >
    <SuspendedLegalLeftSidebarContent />
  </LeftSidebar>
);

export default LegalLeftSidebar;
