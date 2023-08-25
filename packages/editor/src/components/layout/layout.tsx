import { mockStories } from "@storiny/ui/src/mocks";
import { Provider } from "jotai";
import React from "react";

import EditorComposer from "../../composer";
import EditorToolbar from "../toolbar";
import EditorLeftSidebar from "./left-sidebar";
import EditorNavbar from "./navbar";
import EditorRightSidebar from "./right-sidebar";

const EditorLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <Provider>
    <EditorComposer>
      <React.Fragment>
        <EditorNavbar />
        <EditorLeftSidebar story={mockStories[5]} />
        <main>
          {children}
          <EditorToolbar />
        </main>
        <EditorRightSidebar />
      </React.Fragment>
    </EditorComposer>
  </Provider>
);

export default EditorLayout;
