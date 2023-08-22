import { mockStories } from "@storiny/ui/src/mocks";
import React from "react";

import EditorLeftSidebar from "./left-sidebar";
import EditorRightSidebar from "./right-sidebar";

const EditorLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <>
    <EditorLeftSidebar story={mockStories[5]} />
    <main>{children}</main>
    <EditorRightSidebar />
  </>
);

export default EditorLayout;
