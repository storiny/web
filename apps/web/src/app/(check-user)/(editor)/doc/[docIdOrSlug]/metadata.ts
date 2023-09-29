import type { Metadata } from "next";

import { getStory } from "~/common/grpc";

export const generateMetadata = async ({
  params
}: {
  params: { doc_id_or_slug: string };
}): Promise<Metadata> => {
  const { doc_id_or_slug } = params;

  try {
    const storyResponse = await getStory({
      id_or_slug: docIdOrSlug
    });

    return {
      title: `Editing ${storyResponse.title || "document"}`,
      robots: { follow: false, index: false }
    };
  } catch {
    return {
      title: "Editing document",
      robots: { follow: false, index: false }
    };
  }
};
