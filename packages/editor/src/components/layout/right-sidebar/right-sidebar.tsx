import { dynamicLoader } from "@storiny/web/src/common/dynamic";
import dynamic from "next/dynamic";
import React from "react";

import { useMediaQuery } from "~/hooks/useMediaQuery";
import RightSidebar from "~/layout/RightSidebar";
import { breakpoints } from "~/theme/breakpoints";

import { EditorRightSidebarProps } from "./right-sidebar.props";

const SuspendedEditorRightSidebarContent = dynamic(() => import("./content"), {
  loading: dynamicLoader()
});

const EditorRightSidebar = (
  props: EditorRightSidebarProps
): React.ReactElement | null => {
  const shouldRender = useMediaQuery(breakpoints.up("desktop"));

  if (!shouldRender) {
    return null;
  }

  return (
    <RightSidebar hideFooter>
      <SuspendedEditorRightSidebarContent {...props} />
    </RightSidebar>
  );
};

export default EditorRightSidebar;
