import { mockStories } from "@storiny/ui/src/mocks";
import { clsx } from "clsx";
import { Provider } from "jotai";
import React from "react";

import DashboardSplashLayout from "../(dashboard)/me/(splash)/layout";
import EditorLeftSidebar from "./left-sidebar";
import EditorNavbar from "./navbar";
import EditorRightSidebar from "./right-sidebar";
import EditorToolbar from "./toolbar";

const EditorLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx("grid", "dashboard", "no-sidenav")}>
    <DashboardSplashLayout>
      <Provider>
        <EditorNavbar />
        <EditorLeftSidebar story={mockStories[5]} />
        <main>
          {children}
          <EditorToolbar />
        </main>
        <EditorRightSidebar />
      </Provider>
    </DashboardSplashLayout>
  </div>
);

export default EditorLayout;
