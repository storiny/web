import { ImageSize } from "@storiny/shared";
import type { Metadata } from "next";

import { get_story } from "~/common/grpc";
import { get_session_token } from "src/common/utils/get-session-token";
import { get_cdn_url } from "../../../../../../packages/ui/src/utils/get-cdn-url";

export const generateMetadata = async ({
  params
}: {
  params: { id_or_slug: string };
}): Promise<Metadata> => {
  const { id_or_slug } = params;

  try {
    const session_token = get_session_token();
    const story_response = await get_story({
      id_or_slug: id_or_slug,
      token: session_token || undefined
    });

    return {
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      title: story_response.seo_title || story_response.title,
      description: story_response.seo_description || story_response.description,
      openGraph: {
        type: "article",
        siteName: "Storiny",
        title: story_response.title,
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/${
          story_response.user?.username || "story"
        }/${story_response.slug}`,
        description: story_response.description,
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
          : story_response.splash_id
          ? [
              // TODO: Replace with dynamic opengraph images
              {
                url: get_cdn_url(story_response.splash_id, ImageSize.W_1440),
                width: 1200,
                height: 630
              }
            ]
          : []
      },
      twitter: {
        card: "summary_large_image",
        title: story_response.title,
        description: story_response.description,
        images: story_response.preview_image
          ? [get_cdn_url(story_response.preview_image, ImageSize.W_1440)]
          : story_response.splash_id
          ? [get_cdn_url(story_response.splash_id, ImageSize.W_1440)]
          : []
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
