import "server-only";

import { notFound } from "next/navigation";
import React from "react";

import { isSnowflake } from "~/common/utils/isSnowflake";

import ContentStoryMetricsClient from "./client";

const Page = ({
  params: { storyId }
}: {
  params: { storyId: string };
}): React.ReactElement => {
  if (!isSnowflake(storyId)) {
    notFound();
  }

  return <ContentStoryMetricsClient />;
};

export * from "./metadata";
export default Page;
