import { dynamic_loader } from "@storiny/web/src/common/dynamic";
import dynamic from "next/dynamic";
import React from "react";

import { use_media_query } from "../../../../../ui/src/hooks/use-media-query";
import RightSidebar from "../../../../../ui/src/layout/right-sidebar";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { EditorRightSidebarProps } from "./right-sidebar.props";

const SuspendedEditorRightSidebarContent = dynamic(() => import("./content"), {
  loading: dynamic_loader()
});

const EditorRightSidebar = (
  props: EditorRightSidebarProps
): React.ReactElement | null => {
  const should_render = use_media_query(BREAKPOINTS.up("desktop"));

  if (!should_render) {
    return null;
  }

  return (
    <RightSidebar hide_footer>
      <SuspendedEditorRightSidebarContent {...props} />
    </RightSidebar>
  );
};

export default EditorRightSidebar;
