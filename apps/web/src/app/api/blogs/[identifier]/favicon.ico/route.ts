// favicon.ico endpoint

import { Status } from "@grpc/grpc-js/build/src/constants";
import { captureException as capture_exception } from "@sentry/nextjs";

import { get_blog } from "~/common/grpc";
import { is_valid_blog_identifier } from "~/common/utils/is-valid-blog-identifier";

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

    if (blog.favicon) {
      return Response.redirect(
        `${process.env.NEXT_PUBLIC_CDN_URL}/uploads/${blog.favicon}.ico`,
        307
      );
    }

    return Response.redirect(
      `${process.env.NEXT_PUBLIC_WEB_URL}/favicon.ico`,
      307
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
