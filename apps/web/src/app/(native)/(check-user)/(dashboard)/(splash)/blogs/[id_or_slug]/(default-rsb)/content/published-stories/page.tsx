import "server-only";

import React from "react";

import { get_blog_published_story_count } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";

import ContentPublishedStoriesClient from "./client";

const Page = async ({
  params: { id_or_slug }
}: {
  params: { id_or_slug: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const blog_published_story_count_response =
      await get_blog_published_story_count({
        identifier: id_or_slug
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
