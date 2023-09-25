import type { Metadata } from "next";

import { getStory } from "~/common/grpc";

export const generateMetadata = async ({
  params
}: {
  params: { docIdOrSlug: string };
}): Promise<Metadata> => {
  const { docIdOrSlug } = params;

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
