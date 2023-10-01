import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import RightSidebar from "~/layout/right-sidebar";

const SuspendedLegalRightSidebarContent = dynamic(() => import("./content"), {
  loading: dynamic_loader()
});

const LegalRightSidebar = (): React.ReactElement => (
  <RightSidebar hide_footer>
    <SuspendedLegalRightSidebarContent />
  </RightSidebar>
);

export default LegalRightSidebar;
