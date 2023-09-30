"use client";

import { MDXProvider } from "@mdx-js/react";
import { MDXComponents } from "mdx/types";
import React from "react";

import {
  Anchor,
  Blockquote,
  Code,
  HEADING,
  LIST,
  Paragraph,
  Pre,
  Table
} from "./components";

/**
 * Custom markdown components
 */
const COMPONENTS: MDXComponents = {
  h1: HEADING.H1,
  h2: HEADING.H2,
  h3: HEADING.H3,
  h4: HEADING.H4,
  p: Paragraph,
  a: Anchor,
  code: Code,
  ul: LIST.UL,
  ol: LIST.OL,
  li: LIST.LI,
  pre: Pre,
  blockquote: Blockquote,
  table: Table
};

const MarkdownProvider = ({ children }): React.ReactElement => (
  <MDXProvider components={COMPONENTS}>{children}</MDXProvider>
);

export default MarkdownProvider;
