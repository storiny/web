import "server-only";

import Editor from "@storiny/editor";
import { DocUserRole, Story } from "@storiny/types";
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
    const is_writer = user_id === story_metadata_response.user_id;

    if (
      is_writer &&
      typeof story_metadata_response.deleted_at !== "undefined"
    ) {
      const doc = await get_doc_by_key(story_metadata_response.doc_key);
      return (
        <Editor
          doc_id={story_metadata_response.id}
          initial_doc={decompress_sync(doc)}
          is_writer
          role={"editor"}
          status={"deleted"}
          story={story_metadata_response as unknown as Story}
        />
      );
    }

    return (
      <Editor
        doc_id={story_metadata_response.id}
        is_writer={is_writer}
        role={story_metadata_response.role as DocUserRole}
        status={
          typeof story_metadata_response.published_at !== "undefined"
            ? "published"
            : "draft"
        }
        story={story_metadata_response as unknown as Story}
      />
    );
  } catch (e) {
    handle_exception(e);
  }
};

export { generateMetadata } from "./metadata";
export default Page;
