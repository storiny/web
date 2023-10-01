import { dynamic_loader } from "@storiny/web/src/common/dynamic";
import dynamic from "next/dynamic";
import React from "react";

import LeftSidebar from "~/layout/left-sidebar";

import { EditorLeftSidebarProps } from "./left-sidebar.props";

const SuspendedEditorLeftSidebarContent = dynamic(() => import("./content"), {
  loading: dynamic_loader()
});

const EditorLeftSidebar = (
  props: EditorLeftSidebarProps
): React.ReactElement => (
  <LeftSidebar>
    <SuspendedEditorLeftSidebarContent {...props} />
  </LeftSidebar>
);

export default EditorLeftSidebar;
