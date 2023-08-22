import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import RightSidebar from "~/layout/RightSidebar";

const SuspendedLegalRightSidebarContent = dynamic(() => import("./content"), {
  loading: dynamicLoader()
});

const LegalRightSidebar = (): React.ReactElement => (
  <RightSidebar hideFooter>
    <SuspendedLegalRightSidebarContent />
  </RightSidebar>
);

export default LegalRightSidebar;
