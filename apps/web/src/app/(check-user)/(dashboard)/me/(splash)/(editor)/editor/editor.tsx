"use client";

import React from "react";

import Spacer from "~/components/Spacer";

import EditorLoader from "./loader";

const EditorClient = (): React.ReactElement => (
  <React.Fragment>
    <EditorLoader />
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default EditorClient;
