"use client";

import { Provider } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import Navbar from "~/layout/Navbar";

import { storyMetadataAtom } from "../../atoms";
import EditorComposer from "../composer";
import { EditorProps } from "../editor";
import HydrateAtoms from "../hydrate-atoms";
import EditorLeftSidebar from "./left-sidebar";
import EditorNavbar from "./navbar";
import EditorRightSidebar from "./right-sidebar";

const EditorToolbar = dynamic(() => import("../toolbar"));
const StoryMetadataBar = dynamic(() => import("../metadata-bar"));

const EditorLayout = ({
  children,
  readOnly,
  story
}: {
  children: React.ReactNode;
} & Pick<EditorProps, "readOnly" | "story">): React.ReactElement => (
  <Provider>
    <HydrateAtoms values={[[storyMetadataAtom, story]]}>
      <EditorComposer readOnly={readOnly}>
        <React.Fragment>
          {readOnly ? <Navbar /> : <EditorNavbar />}
          <EditorLeftSidebar readOnly={readOnly} />
          <main>
            {!readOnly && <StoryMetadataBar />}
            {children}
            {!readOnly && <EditorToolbar />}
          </main>
          <EditorRightSidebar readOnly={readOnly} />
        </React.Fragment>
      </EditorComposer>
    </HydrateAtoms>
  </Provider>
);

export default EditorLayout;
