import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import LeftSidebar from "../../../../../../../packages/ui/src/layout/left-sidebar";

const SuspendedLegalLeftSidebarContent = dynamic(() => import("./content"), {
  loading: dynamic_loader()
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
