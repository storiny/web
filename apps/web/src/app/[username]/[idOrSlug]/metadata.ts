import { ImageSize } from "@storiny/shared";
import type { Metadata } from "next";

import { getStory } from "~/common/grpc";
import { getSessionToken } from "~/common/utils/getSessionToken";
import { getCdnUrl } from "~/utils/getCdnUrl";

export const generateMetadata = async ({
  params
}: {
  params: { idOrSlug: string };
}): Promise<Metadata> => {
  const { idOrSlug } = params;

  try {
    const sessionToken = getSessionToken();
    const storyResponse = await getStory({
      id_or_slug: idOrSlug,
      token: sessionToken || undefined
    });

    return {
      title: storyResponse.seo_title || storyResponse.title,
      description: storyResponse.seo_description || storyResponse.description,
      openGraph: {
        type: "article",
        siteName: "Storiny",
        title: storyResponse.title,
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/${
          storyResponse.user?.username || "story"
        }/${storyResponse.slug}`,
        description: storyResponse.description,
        images: storyResponse.preview_image
          ? [
              {
                url: getCdnUrl(storyResponse.preview_image, ImageSize.W_1440),
                width: 1200,
                height: 630
              }
            ]
          : storyResponse.splash_id
          ? [
              // TODO: Replace with dynamic opengraph images
              {
                url: getCdnUrl(storyResponse.splash_id, ImageSize.W_1440),
                width: 1200,
                height: 630
              }
            ]
          : []
      },
      twitter: {
        card: "summary_large_image",
        title: storyResponse.title,
        description: storyResponse.description,
        images: storyResponse.preview_image
          ? [getCdnUrl(storyResponse.preview_image, ImageSize.W_1440)]
          : storyResponse.splash_id
          ? [getCdnUrl(storyResponse.splash_id, ImageSize.W_1440)]
          : []
      },
      alternates: {
        canonical: storyResponse.canonical_url
      }
    };
  } catch {
    return {
      title: "Unknown story"
    };
  }
};
