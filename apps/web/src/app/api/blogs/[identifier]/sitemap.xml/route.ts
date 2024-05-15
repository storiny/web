// sitemap.xml endpoint

import { Status } from "@grpc/grpc-js/build/src/constants";
import { captureException as capture_exception } from "@sentry/nextjs";

import { get_blog_sitemap } from "~/common/grpc";
import { is_valid_blog_identifier } from "~/common/utils/is-valid-blog-identifier";

export const GET = async (
  _: Request,
  { params }: { params: { identifier: string } }
): Promise<Response> => {
  try {
    const { identifier } = params;

    if (!is_valid_blog_identifier(identifier)) {
      return new Response("Invalid blog identifier", { status: 400 });
    }

    const sitemap = await get_blog_sitemap({ identifier });

    return new Response(sitemap.content, {
      status: 200,
      headers: { "Content-Type": "text/xml" }
    });
  } catch (err) {
    const err_code = err?.code;

    if (err_code === Status.NOT_FOUND) {
      return new Response("Not found", { status: 404 });
    }

    capture_exception(err);

    return new Response("Internal error", { status: 500 });
  }
};
