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
  read_only,
  story,
  status = "draft"
}: {
  children: React.ReactNode;
} & Pick<
  EditorProps,
  "read_only" | "story" | "status"
>): React.ReactElement => (
  <Provider>
    <HydrateMetadata story={story}>
      <EditorComposer read_only={status === "deleted" || read_only}>
        <React.Fragment>
          {read_only ? <Navbar /> : <EditorNavbar status={status} />}
          <EditorLeftSidebar read_only={read_only} status={status} />
          <main>
            {status !== "deleted" && !read_only ? <StoryMetadataBar /> : null}
            {children}
            {status !== "deleted" && !read_only ? <EditorToolbar /> : null}
          </main>
          <EditorRightSidebar read_only={read_only} status={status} />
        </React.Fragment>
      </EditorComposer>
    </HydrateMetadata>
  </Provider>
);

export default EditorLayout;
