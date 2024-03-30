import { Status } from "@grpc/grpc-js/build/src/constants";
import { captureException as capture_exception } from "@sentry/nextjs";
import { ImageSize } from "@storiny/shared";
import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { Metadata, ResolvingMetadata } from "next";
import { notFound as not_found } from "next/dist/client/components/not-found";

import { get_blog } from "~/common/grpc";
import { get_user } from "~/common/utils/get-user";
import { is_valid_blog_slug } from "~/common/utils/is-valid-blog-slug";
import { get_cdn_url } from "~/utils/get-cdn-url";

export const generateMetadata = async ({
  params,
  parent: resolving
}: {
  params: { slug: string };
  parent: ResolvingMetadata;
}): Promise<Metadata> => {
  const { slug } = params;

  try {
    if (!is_valid_blog_slug(slug)) {
      return not_found();
    }

    const user_id = await get_user();
    const blog = await get_blog({
      identifier: slug,
      current_user_id: user_id || undefined
    });
    const parent = await resolving;
    const blog_url = get_blog_url(blog);

    return {
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      title: {
        template: `%s — ${blog.seo_title || blog.name}`,
        default: blog.seo_title || blog.name
      },
      manifest: `${blog_url}/app.webmanifest`,
      applicationName: blog.name,
      description: blog.seo_description || blog.description,
      publisher: "Storiny",
      generator: "Storiny",
      category: blog.category,
      icons: blog.favicon
        ? [
            {
              rel: "icon",
              sizes: "any",
              url: "/favicon.ico"
            },
            {
              rel: "icon",
              sizes: "any",
              type: "image/png",
              url: get_cdn_url(blog.favicon, ImageSize.W_64)
            },
            {
              rel: "shortcut icon",
              type: "image/png",
              url: get_cdn_url(blog.favicon, ImageSize.W_64)
            },
            {
              rel: "apple-touch-icon",
              url: blog.logo_id
                ? get_cdn_url(blog.logo_id, ImageSize.W_320)
                : `${process.env.NEXT_PUBLIC_WEB_URL}/icons/apple-touch-icon.png`
            }
          ]
        : parent?.icons,
      openGraph: {
        title: blog.seo_title || blog.name,
        description: blog.seo_description || blog.description,
        url: blog_url,
        siteName: blog.name,
        images: blog.preview_image
          ? [
              {
                url: get_cdn_url(blog.preview_image, ImageSize.W_1440),
                width: 1200,
                height: 630
              }
            ]
          : undefined,
        locale: "en_US",
        type: "website"
      },
      twitter: {
        card: blog.preview_image ? "summary_large_image" : "summary",
        title: blog.seo_title || blog.name,
        description: blog.seo_description || blog.description,
        images: blog.preview_image
          ? [get_cdn_url(blog.preview_image, ImageSize.W_1440)]
          : blog.logo_id
            ? [get_cdn_url(blog.logo_id, ImageSize.W_320)]
            : undefined
      },
      archives: `${blog_url}/archive`
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    };
  } catch (err) {
    const err_code = err?.code;

    if (err_code !== Status.NOT_FOUND && err_code !== Status.UNAUTHENTICATED) {
      capture_exception(err);
    }

    return { title: "Unknown blog" };
  }
};
