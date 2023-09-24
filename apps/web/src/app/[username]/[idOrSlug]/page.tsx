import "server-only";

import Editor from "@storiny/editor";
import { Story } from "@storiny/types";
import { decompressSync } from "fflate";
import { notFound } from "next/navigation";
import React from "react";

import { getStory } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getDocByKey } from "~/common/utils/get-doc-by-key";
import { getSessionToken } from "~/common/utils/getSessionToken";

const Page = async ({
  params: { idOrSlug }
}: {
  params: { idOrSlug: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const sessionToken = getSessionToken();
    const storyResponse = await getStory({
      id_or_slug: idOrSlug,
      token: sessionToken || undefined
    });

    if (
      !storyResponse.user ||
      typeof storyResponse.published_at === "undefined" ||
      typeof storyResponse.deleted_at !== "undefined"
    ) {
      notFound();
    }

    if (!storyResponse.user.is_self) {
      if (storyResponse.user.is_private && !storyResponse.user.is_friend) {
        // TODO: Private story
      } else if (storyResponse.user.is_blocked_by_user) {
        // Handle blocked
      }
    }

    const doc = await getDocByKey(storyResponse.doc_key);

    return (
      <Editor
        docId={storyResponse.id}
        initialDoc={decompressSync(doc)}
        readOnly
        role={"editor"}
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
