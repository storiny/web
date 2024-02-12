import { dynamic_loader } from "@storiny/web/src/common/dynamic";
import dynamic from "next/dynamic";
import React from "react";

import RightSidebar from "~/layout/right-sidebar";
import css from "~/theme/main.module.scss";

import { EditorRightSidebarProps } from "./right-sidebar.props";

const SuspendedEditorRightSidebarContent = dynamic(() => import("./content"), {
  loading: dynamic_loader()
});

const EditorRightSidebar = (
  props: EditorRightSidebarProps
): React.ReactElement => (
  <RightSidebar className={css["above-desktop"]} hide_footer>
    <SuspendedEditorRightSidebarContent {...props} />
  </RightSidebar>
);

export default EditorRightSidebar;
