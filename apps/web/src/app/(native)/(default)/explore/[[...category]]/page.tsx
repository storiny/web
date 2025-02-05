import "server-only";

import { StoryCategory } from "@storiny/shared";
import { notFound as not_found } from "next/navigation";
import React from "react";

import { CATEGORIES } from "../categories";
import Client from "./client";

const Page = async ({
  params
}: {
  params: Promise<{ category: string[] }>;
}): Promise<React.ReactElement> => {
  const category = ((await params).category || [""])[0] as StoryCategory | "";

  if (!CATEGORIES.find((item) => item === category) && category !== "") {
    not_found();
  }

  return <Client category={category || "all"} />;
};

export { generateMetadata } from "./metadata";
export default Page;
