import "server-only";

import { StoryCategory } from "@storiny/shared";
import { notFound } from "next/navigation";
import React from "react";

import { CATEGORIES } from "../categories";
import Client from "./client";

const Page = ({
  params
}: {
  params: { category: string[] };
}): React.ReactElement => {
  const category = (params.category || [""])[0] as StoryCategory | "";

  if (!CATEGORIES.find((item) => item === category) && category !== "") {
    notFound();
  }

  return <Client category={category || "all"} />;
};

export * from "./metadata";
export default Page;
