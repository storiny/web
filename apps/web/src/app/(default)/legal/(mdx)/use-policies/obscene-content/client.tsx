"use client";

import React from "react";

import MDXPattern from "../../pattern";
import Content, { meta } from "./content.mdx";

const ObsceneContentPolicy = (): React.ReactElement => (
  <MDXPattern meta={meta}>
    <Content />
  </MDXPattern>
);

export default ObsceneContentPolicy;
