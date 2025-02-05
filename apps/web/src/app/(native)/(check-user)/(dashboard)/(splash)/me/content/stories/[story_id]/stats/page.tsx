import "server-only";

import { notFound as not_found, redirect } from "next/navigation";
import React from "react";

import { validate_story } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";
import { is_snowflake } from "~/common/utils/is-snowflake";

import ContentStoryStatsClient from "./client";

const Page = async ({
  params
}: {
  params: Promise<{ story_id: string }>;
}): Promise<React.ReactElement | undefined> => {
  const { story_id } = await params;

  try {
    if (!is_snowflake(story_id)) {
      not_found();
    }

    const user_id = await get_user();

    if (!user_id) {
      redirect(
        `/login?to=${encodeURIComponent(
          `/me/content/stories/${story_id}/stats`
        )}`
      );
    }

    await validate_story({
      user_id,
      story_id
    });

    return <ContentStoryStatsClient story_id={story_id} />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
