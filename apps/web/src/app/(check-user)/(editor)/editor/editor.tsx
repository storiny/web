"use client";

import dynamic from "next/dynamic";
import React from "react";

import Spacer from "~/components/Spacer";

import EditorLoader from "./loader";

const EditorShortcuts = dynamic(() => import("../shortcuts"));

const EditorClient = (): React.ReactElement => (
  <React.Fragment>
    <EditorLoader />
    <Spacer orientation={"vertical"} size={10} />
    <EditorShortcuts />
  </React.Fragment>
);

export default EditorClient;
