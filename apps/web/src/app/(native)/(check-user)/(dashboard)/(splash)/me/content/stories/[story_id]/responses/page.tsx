import "server-only";

import { notFound as not_found, redirect } from "next/navigation";
import React from "react";

import { get_story_responses_info } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";
import { is_snowflake } from "~/common/utils/is-snowflake";

import ContentStoryResponsesClient from "./client";

const Page = async ({
  params: { story_id }
}: {
  params: { story_id: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    if (!is_snowflake(story_id)) {
      not_found();
    }

    const user_id = await get_user();

    if (!user_id) {
      redirect(
        `/login?to=${encodeURIComponent(
          `/me/content/stories/${story_id}/responses`
        )}`
      );
    }

    const story_responses_info_response = await get_story_responses_info({
      user_id,
      story_id
    });

    return (
      <ContentStoryResponsesClient
        {...story_responses_info_response}
        story_id={story_id}
      />
    );
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
