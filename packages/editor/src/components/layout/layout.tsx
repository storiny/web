"use client";

import { Provider } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import Navbar from "~/layout/Navbar";

import EditorComposer from "../composer";
import { EditorProps } from "../editor";
import EditorLeftSidebar from "./left-sidebar";
import EditorNavbar from "./navbar";
import EditorRightSidebar from "./right-sidebar";

const EditorToolbar = dynamic(() => import("../toolbar"));

const EditorLayout = ({
  children,
  readOnly,
  story
}: {
  children: React.ReactNode;
} & Pick<EditorProps, "readOnly" | "story">): React.ReactElement => (
  <Provider>
    <EditorComposer readOnly={readOnly}>
      <React.Fragment>
        {readOnly ? <Navbar /> : <EditorNavbar />}
        <EditorLeftSidebar readOnly={readOnly} story={story} />
        <main>
          {children}
          {!readOnly && <EditorToolbar />}
        </main>
        <EditorRightSidebar readOnly={readOnly} />
      </React.Fragment>
    </EditorComposer>
  </Provider>
);

export default EditorLayout;
