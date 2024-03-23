import { ImageSize } from "@storiny/shared";
import type { Metadata } from "next";

import { get_story } from "~/common/grpc";
import { get_user } from "~/common/utils/get-user";
import { get_cdn_url } from "~/utils/get-cdn-url";

export const generateMetadata = async ({
  params
}: {
  params: { id_or_slug: string };
}): Promise<Metadata> => {
  const { id_or_slug } = params;

  try {
    const user_id = await get_user();
    const story_response = await get_story({
      id_or_slug: id_or_slug,
      current_user_id: user_id || undefined
    });

    return {
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      title: story_response.seo_title || story_response.title,
      description: story_response.seo_description || story_response.description,
      openGraph: {
        type: "article",
        siteName: "Storiny",
        title: story_response.seo_title || story_response.title,
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/${
          story_response.user?.username || "story"
        }/${story_response.slug}`,
        description:
          story_response.seo_description || story_response.description,
        // TODO: Replace with dynamic images
        images: story_response.preview_image
          ? [
              {
                url: get_cdn_url(
                  story_response.preview_image,
                  ImageSize.W_1440
                ),
                width: 1200,
                height: 630
              }
            ]
          : undefined
      },
      twitter: {
        card: "summary_large_image",
        title: story_response.seo_title || story_response.title,
        description:
          story_response.seo_description || story_response.description,
        images: story_response.preview_image
          ? [get_cdn_url(story_response.preview_image, ImageSize.W_1440)]
          : undefined
      },
      alternates: {
        canonical: story_response.canonical_url
      }
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    };
  } catch {
    return {
      title: "Unknown story"
    };
  }
};
