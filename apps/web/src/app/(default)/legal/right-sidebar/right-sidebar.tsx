import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import RightSidebar from "../../../../../../../packages/ui/src/layout/right-sidebar";

const SuspendedLegalRightSidebarContent = dynamic(() => import("./content"), {
  loading: dynamicLoader()
});

const LegalRightSidebar = (): React.ReactElement => (
  <RightSidebar hide_footer>
    <SuspendedLegalRightSidebarContent />
  </RightSidebar>
);

export default LegalRightSidebar;
