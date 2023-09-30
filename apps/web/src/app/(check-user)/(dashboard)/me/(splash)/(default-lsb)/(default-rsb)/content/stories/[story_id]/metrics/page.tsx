import "server-only";

import { notFound } from "next/navigation";
import React from "react";

import { is_snowflake } from "src/common/utils/is-snowflake";

import ContentStoryMetricsClient from "./client";

const Page = ({
  params: { story_id }
}: {
  params: { story_id: string };
}): React.ReactElement => {
  if (!is_snowflake(story_id)) {
    notFound();
  }

  return <ContentStoryMetricsClient />;
};

export * from "./metadata";
export default Page;
