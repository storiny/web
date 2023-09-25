import "server-only";

import { Story } from "@storiny/types";
import { notFound, redirect } from "next/navigation";
import React from "react";

import { getStory } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getDocByKey } from "~/common/utils/get-doc-by-key";
import { getSessionToken } from "~/common/utils/getSessionToken";

import Component from "./component";
import RestrictedStory from "./restricted";

const Page = async ({
  params: { idOrSlug, username }
}: {
  params: { idOrSlug: string; username: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const sessionToken = getSessionToken();
    const storyResponse = await getStory({
      id_or_slug: idOrSlug,
      token: sessionToken || undefined
    });

    if (
      !storyResponse.user || // Sanity
      (typeof storyResponse.published_at === "undefined" &&
        typeof storyResponse.first_published_at === "undefined") || // Story was never published
      typeof storyResponse.deleted_at !== "undefined" // Delete story
    ) {
      notFound();
    }

    // Story unpubished
    if (
      typeof storyResponse.first_published_at !== "undefined" &&
      typeof storyResponse.published_at === "undefined"
    ) {
      return <RestrictedStory type={"unpublished"} user={storyResponse.user} />;
    }

    // Redirect if the username is incorrect
    if (storyResponse.user.username !== username) {
      redirect(`/${storyResponse.user.username}/${storyResponse.slug}`);
    }

    if (!storyResponse.user.is_self) {
      if (storyResponse.user.is_private && !storyResponse.user.is_friend) {
        notFound(); // Private story
      } else if (storyResponse.user.is_blocked_by_user) {
        storyResponse.user.bio = ""; // Hide bio

        return (
          <RestrictedStory type={"unpublished"} user={storyResponse.user} />
        );
      }
    }

    // Uint8Array needs to be converted into an untyped array so that it can be
    // safely serialized to JSON for client-side hydration. It is converted back
    // into a Uint8Array on the client side.
    const doc = Array.from(await getDocByKey(storyResponse.doc_key));

    return (
      <Component
        doc={doc}
        story={
          {
            ...storyResponse,
            stats: {
              read_count: storyResponse.read_count,
              comment_count: storyResponse.comment_count,
              like_count: storyResponse.like_count
            }
          } as Story
        }
      />
    );
  } catch (e) {
    handleException(e);
  }
};

export * from "./metadata";
export default Page;
