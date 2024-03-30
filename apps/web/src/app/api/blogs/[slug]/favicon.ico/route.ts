// favicon.ico endpoint

import { Status } from "@grpc/grpc-js/build/src/constants";
import { captureException as capture_exception } from "@sentry/nextjs";

import { get_blog } from "~/common/grpc";

export const GET = async (
  _: Request,
  { params }: { params: { slug: string } }
): Promise<Response> => {
  try {
    const { slug } = params;
    const blog = await get_blog({ identifier: slug });

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
