import type { Metadata } from "next";

import { get_story_metadata } from "~/common/grpc";
import { get_user } from "~/common/utils/get-user";

export const generateMetadata = async ({
  params
}: {
  params: { doc_id_or_slug: string };
}): Promise<Metadata> => {
  const { doc_id_or_slug } = params;

  try {
    const user_id = await get_user();
    const story_metadata_response = await get_story_metadata({
      id_or_slug: doc_id_or_slug,
      user_id: user_id || ""
    });

    return {
      title: `Editing ${story_metadata_response.title || "document"}`,
      robots: { follow: false, index: false }
    };
  } catch {
    return {
      title: "Editing document",
      robots: { follow: false, index: false }
    };
  }
};
