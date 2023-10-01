import "server-only";

import { Story } from "@storiny/types";
import { notFound as not_found, redirect } from "next/navigation";
import React from "react";

import { get_story } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_doc_by_key } from "~/common/utils/get-doc-by-key";
import { get_session_token } from "~/common/utils/get-session-token";

import Component from "./component";
import RestrictedStory from "./restricted";

const Page = async ({
  params: { id_or_slug, username }
}: {
  params: { id_or_slug: string; username: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const session_token = get_session_token();
    const story_response = await get_story({
      id_or_slug: id_or_slug,
      token: session_token || undefined
    });

    if (
      !story_response.user || // Sanity
      (typeof story_response.published_at === "undefined" &&
        typeof story_response.first_published_at === "undefined") || // Story was never published
      typeof story_response.deleted_at !== "undefined" // Delete story
    ) {
      not_found();
    }

    // Story unpubished
    if (
      typeof story_response.first_published_at !== "undefined" &&
      typeof story_response.published_at === "undefined"
    ) {
      return (
        <RestrictedStory type={"unpublished"} user={story_response.user} />
      );
    }

    // Redirect if the username is incorrect
    if (story_response.user.username !== username) {
      redirect(`/${story_response.user.username}/${story_response.slug}`);
    }

    if (!story_response.user.is_self) {
      if (story_response.user.is_private && !story_response.user.is_friend) {
        not_found(); // Private story
      } else if (story_response.user.is_blocked_by_user) {
        story_response.user.bio = ""; // Hide bio

        return (
          <RestrictedStory type={"unpublished"} user={story_response.user} />
        );
      }
    }

    // Uint8Array needs to be converted into an untyped array so that it can be
    // safely serialized to JSON for client-side hydration. It is converted back
    // into a Uint8Array on the client side.
    const doc = Array.from(await get_doc_by_key(story_response.doc_key));

    return <Component doc={doc} story={story_response as Story} />;
  } catch (e) {
    handle_exception(e);
  }
};

export * from "./metadata";
export default Page;
