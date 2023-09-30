import "server-only";

import Editor from "@storiny/editor";
import { Story } from "@storiny/types";
import { decompressSync as decompress_sync } from "fflate";
import { notFound as not_found, redirect } from "next/navigation";
import React from "react";

import { get_story } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_doc_by_key } from "~/common/utils/get-doc-by-key";
import { get_user } from "src/common/utils/get-user";

const Page = async ({
  params: { doc_id_or_slug }
}: {
  params: { doc_id_or_slug: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const user_id = await get_user();

    if (!user_id) {
      redirect("/login");
    }

    const story_response = await get_story({
      id_or_slug: doc_id_or_slug
    });

    if (story_response.user?.id !== user_id) {
      not_found();
    }

    if (typeof story_response.deleted_at !== "undefined") {
      const doc = await get_doc_by_key(story_response.doc_key);
      return (
        <Editor
          doc_id={story_response.id}
          initial_doc={decompress_sync(doc)}
          role={"editor"}
          status={"deleted"}
          story={
            {
              ...story_response,
              stats: {
                read_count: story_response.read_count,
                comment_count: story_response.comment_count,
                like_count: story_response.like_count
              }
            } as Story
          }
        />
      );
    }

    return (
      <Editor
        doc_id={story_response.id}
        role={"editor"}
        status={
          typeof story_response.published_at !== "undefined"
            ? "published"
            : "draft"
        }
        story={
          {
            ...story_response,
            stats: {
              read_count: story_response.read_count,
              comment_count: story_response.comment_count,
              like_count: story_response.like_count
            }
          } as Story
        }
      />
    );
  } catch (e) {
    handle_exception(e);
  }
};

export * from "./metadata";
export default Page;
