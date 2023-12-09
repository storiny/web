import "server-only";

import Editor from "@storiny/editor";
import { Story } from "@storiny/types";
import { decompressSync as decompress_sync } from "fflate";
import { redirect } from "next/navigation";
import React from "react";

import { get_story_metadata } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_doc_by_key } from "~/common/utils/get-doc-by-key";
import { get_user } from "~/common/utils/get-user";

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

    const story_metadata_response = await get_story_metadata({
      id_or_slug: doc_id_or_slug,
      user_id
    });

    if (typeof story_metadata_response.deleted_at !== "undefined") {
      const doc = await get_doc_by_key(story_metadata_response.doc_key);
      return (
        <Editor
          doc_id={story_metadata_response.id}
          initial_doc={decompress_sync(doc)}
          role={"editor"}
          status={"deleted"}
          story={story_metadata_response as Story}
        />
      );
    }

    return (
      <Editor
        doc_id={story_metadata_response.id}
        role={"editor"}
        status={
          typeof story_metadata_response.published_at !== "undefined"
            ? "published"
            : "draft"
        }
        story={story_metadata_response as Story}
      />
    );
  } catch (e) {
    handle_exception(e);
  }
};

export * from "./metadata";
export default Page;
