"use client";

import React from "react";

import MDXPattern from "../../pattern";
import Content, { meta } from "./content.mdx";

const TermsOfServiceClient = (): React.ReactElement => (
  <MDXPattern meta={meta}>
    <Content />
  </MDXPattern>
);

export default TermsOfServiceClient;
