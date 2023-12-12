import "server-only";

import { notFound as not_found, redirect } from "next/navigation";
import React from "react";

import { get_comment } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";
import { is_snowflake } from "~/common/utils/is-snowflake";
import { is_valid_username } from "~/common/utils/is-valid-username";

import Component from "./component";

const Page = async ({
  params: { id_or_slug, username, comment_id }
}: {
  params: { comment_id: string; id_or_slug: string; username: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    if (!is_snowflake(comment_id)) {
      not_found();
    }

    // Links to the story can be in the form of `/story/story_id`
    if (!is_valid_username(username) && username !== "story") {
      not_found();
    }

    const user_id = await get_user();
    const comment_response = await get_comment({
      id: comment_id,
      current_user_id: user_id || undefined
    });

    // Redirect if the username or story slug is incorrect
    if (
      comment_response.story_writer_username !== username ||
      comment_response.story_slug !== id_or_slug
    ) {
      redirect(
        `/${comment_response.story_writer_username}/${comment_response.story_slug}`
      );
    }

    return <Component {...comment_response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export * from "./metadata";
export default Page;
