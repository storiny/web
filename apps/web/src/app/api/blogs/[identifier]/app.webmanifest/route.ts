// favicon.ico endpoint

import { Status } from "@grpc/grpc-js/build/src/constants";
import { captureException as capture_exception } from "@sentry/nextjs";
import { ImageSize } from "@storiny/shared";

import { get_blog } from "~/common/grpc";
import { is_valid_blog_identifier } from "~/common/utils/is-valid-blog-identifier";
import { get_cdn_url } from "~/utils/get-cdn-url";

export const dynamic = "force-static";
export const revalidate = 86_400; // 24 hours

export const GET = async (
  _: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> => {
  try {
    const { identifier } = await params;

    if (!is_valid_blog_identifier(identifier)) {
      return new Response("Invalid blog identifier", { status: 400 });
    }

    const blog = await get_blog({ identifier });

    return new Response(
      JSON.stringify({
        name: blog.name,
        categories: [blog.category],
        description: blog.description,
        display: "standalone",
        scope: "/",
        start_url: "/?utm_source=app",
        id: "/?utm_source=app",
        short_name: blog.name,
        theme_color: "#17191c",
        background_color: "#000000",
        icons: blog.logo_id
          ? [
              {
                src: get_cdn_url(blog.logo_id, ImageSize.W_320),
                type: "image/png",
                sizes: "192x192"
              },
              {
                src: get_cdn_url(blog.logo_id, ImageSize.W_640),
                type: "image/png",
                sizes: "512x512"
              },
              {
                src: get_cdn_url(blog.logo_id, ImageSize.W_320),
                type: "image/png",
                sizes: "192x192",
                purpose: "maskable"
              },
              {
                src: get_cdn_url(blog.logo_id, ImageSize.W_640),
                type: "image/png",
                sizes: "512x512",
                purpose: "maskable"
              }
            ]
          : []
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/manifest+json" }
      }
    );
  } catch (err) {
    const err_code = err?.code;

    if (err_code === Status.NOT_FOUND) {
      return new Response("Not found", { status: 404 });
    }

    capture_exception(err);

    return new Response("Internal error", { status: 500 });
  }
};
