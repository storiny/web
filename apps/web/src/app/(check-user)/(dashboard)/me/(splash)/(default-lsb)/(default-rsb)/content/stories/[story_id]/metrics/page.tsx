import "server-only";

import { notFound as not_found } from "next/navigation";
import React from "react";

import { is_snowflake } from "~/common/utils/is-snowflake";

import ContentStoryMetricsClient from "./client";

const Page = ({
  params: { story_id }
}: {
  params: { story_id: string };
}): React.ReactElement => {
  if (!is_snowflake(story_id)) {
    not_found();
  }

  return <ContentStoryMetricsClient />;
};

export * from "./metadata";
export default Page;
