import { Status } from "@grpc/grpc-js/build/src/constants";
import { captureException as capture_exception } from "@sentry/nextjs";
import { ImageSize } from "@storiny/shared";
import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import type { Metadata } from "next";
import { notFound as not_found } from "next/dist/client/components/not-found";

import { get_story } from "~/common/grpc";
import { get_user } from "~/common/utils/get-user";
import { is_valid_blog_slug } from "~/common/utils/is-valid-blog-slug";
import { get_cdn_url } from "~/utils/get-cdn-url";

export const generateMetadata = async ({
  params
}: {
  params: { slug: string; story_id_or_slug: string };
}): Promise<Metadata> => {
  const { story_id_or_slug, slug } = params;

  if (!is_valid_blog_slug(slug)) {
    not_found();
  }

  try {
    const user_id = await get_user();
    const story_response = await get_story({
      id_or_slug: story_id_or_slug,
      current_user_id: user_id || undefined
    });

    if (!story_response.blog) {
      not_found();
    }

    return {
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      title: story_response.seo_title || story_response.title,
      description: story_response.seo_description || story_response.description,
      openGraph: {
        type: "article",
        siteName: story_response.blog.name,
        title: story_response.seo_title || story_response.title,
        url: `${get_blog_url(story_response.blog)}/${story_response.slug}`,
        description:
          story_response.seo_description || story_response.description,
        images: [
          {
            url: story_response.preview_image
              ? get_cdn_url(story_response.preview_image, ImageSize.W_1440)
              : `${process.env.NEXT_PUBLIC_OG_SERVER_URL}/stories/${story_response.id}`,
            width: 1200,
            height: 630
          }
        ]
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
  } catch (err) {
    const err_code = err?.code;

    if (err_code !== Status.NOT_FOUND && err_code !== Status.UNAUTHENTICATED) {
      capture_exception(err);
    }

    return {
      title: "Unknown story"
    };
  }
};
