import "server-only";

import Editor from "@storiny/editor";
import { Story } from "@storiny/types";
import { decompressSync } from "fflate";
import { notFound, redirect } from "next/navigation";
import React from "react";

import { getStory } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getDocByKey } from "~/common/utils/get-doc-by-key";
import { getUser } from "~/common/utils/getUser";

const Page = async ({
  params: { docIdOrSlug }
}: {
  params: { docIdOrSlug: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const userId = await getUser();

    if (!userId) {
      redirect("/login");
    }

    const storyResponse = await getStory({
      id_or_slug: docIdOrSlug
    });

    if (storyResponse.user?.id !== userId) {
      notFound();
    }

    if (typeof storyResponse.deleted_at !== "undefined") {
      const doc = await getDocByKey(storyResponse.doc_key);
      return (
        <Editor
          docId={storyResponse.id}
          initialDoc={decompressSync(doc)}
          role={"editor"}
          status={"deleted"}
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
    }

    return (
      <Editor
        docId={storyResponse.id}
        role={"editor"}
        status={
          typeof storyResponse.published_at !== "undefined"
            ? "published"
            : "draft"
        }
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
