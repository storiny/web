import type { Metadata } from "next";

import { get_story } from "~/common/grpc";

export const generateMetadata = async ({
  params
}: {
  params: { doc_id_or_slug: string };
}): Promise<Metadata> => {
  const { doc_id_or_slug } = params;

  try {
    const story_response = await get_story({
      id_or_slug: doc_id_or_slug
    });

    return {
      title: `Editing ${story_response.title || "document"}`,
      robots: { follow: false, index: false }
    };
  } catch {
    return {
      title: "Editing document",
      robots: { follow: false, index: false }
    };
  }
};
