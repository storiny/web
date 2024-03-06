import "server-only";

import { notFound as not_found } from "next/navigation";
import React from "react";

import { use_blog_context } from "~/common/context/blog";

import ContentEditorsClient from "./client";

const Page = (): React.ReactElement => {
  const blog = use_blog_context();

  if (blog.role !== "owner") {
    not_found();
  }

  return <ContentEditorsClient />;
};

export { metadata } from "./metadata";
export default Page;
