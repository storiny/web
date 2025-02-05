import "server-only";

import React from "react";

import { get_blog_pending_story_count } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";

import ContentPendingStoriesClient from "./client";

const Page = async ({
  params
}: {
  params: Promise<{ identifier: string }>;
}): Promise<React.ReactElement | undefined> => {
  const { identifier } = await params;

  try {
    const blog_pending_story_count_response =
      await get_blog_pending_story_count({
        identifier
      });

    return (
      <ContentPendingStoriesClient {...blog_pending_story_count_response} />
    );
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
