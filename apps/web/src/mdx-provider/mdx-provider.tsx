"use client";

import { MDXProvider } from "@mdx-js/react";
import { MDXComponents } from "mdx/types";
import React from "react";

import {
  Anchor,
  Blockquote,
  Code,
  Heading,
  List,
  Paragraph,
  Table
} from "./components";

/**
 * Custom markdown components
 */
const components: MDXComponents = {
  h1: Heading.H1,
  h2: Heading.H2,
  h3: Heading.H3,
  h4: Heading.H4,
  p: Paragraph,
  a: Anchor,
  code: Code,
  ul: List.UL,
  ol: List.OL,
  li: List.LI,
  blockquote: Blockquote,
  table: Table
};

const MarkdownProvider = ({ children }): React.ReactElement => (
  <MDXProvider components={components}>{children}</MDXProvider>
);

export default MarkdownProvider;
