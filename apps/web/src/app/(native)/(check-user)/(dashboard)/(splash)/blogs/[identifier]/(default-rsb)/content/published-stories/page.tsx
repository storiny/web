import "server-only";

import React from "react";

import { get_blog_published_story_count } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";

import ContentPublishedStoriesClient from "./client";

const Page = async ({
  params: { identifier }
}: {
  params: { identifier: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const blog_published_story_count_response =
      await get_blog_published_story_count({
        identifier
      });

    return (
      <ContentPublishedStoriesClient {...blog_published_story_count_response} />
    );
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
