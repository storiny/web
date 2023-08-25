import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import LeftSidebar from "~/layout/LeftSidebar";

import { EditorLeftSidebarProps } from "./left-sidebar.props";

const SuspendedEditorLeftSidebarContent = dynamic(() => import("./content"), {
  loading: dynamicLoader()
});

const EditorLeftSidebar = (
  props: EditorLeftSidebarProps
): React.ReactElement => (
  <LeftSidebar>
    <SuspendedEditorLeftSidebarContent {...props} />
  </LeftSidebar>
);

export default EditorLeftSidebar;
