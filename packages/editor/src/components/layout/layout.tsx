"use client";

import { Provider } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import Navbar from "../../../../ui/src/layout/navbar";

import EditorComposer from "../composer";
import { EditorProps } from "../editor";
import HydrateMetadata from "../hydrate-metadata";
import EditorLeftSidebar from "./left-sidebar";
import EditorNavbar from "./navbar";
import EditorRightSidebar from "./right-sidebar";

const EditorToolbar = dynamic(() => import("../toolbar"));
const StoryMetadataBar = dynamic(() => import("../metadata-bar"));

const EditorLayout = ({
  children,
  readOnly,
  story,
  status = "draft"
}: {
  children: React.ReactNode;
} & Pick<EditorProps, "readOnly" | "story" | "status">): React.ReactElement => (
  <Provider>
    <HydrateMetadata story={story}>
      <EditorComposer readOnly={status === "deleted" || readOnly}>
        <React.Fragment>
          {readOnly ? <Navbar /> : <EditorNavbar status={status} />}
          <EditorLeftSidebar readOnly={readOnly} status={status} />
          <main>
            {status !== "deleted" && !readOnly ? <StoryMetadataBar /> : null}
            {children}
            {status !== "deleted" && !readOnly ? <EditorToolbar /> : null}
          </main>
          <EditorRightSidebar readOnly={readOnly} status={status} />
        </React.Fragment>
      </EditorComposer>
    </HydrateMetadata>
  </Provider>
);

export default EditorLayout;
