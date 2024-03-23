// sitemap.xml endpoint

import { Status } from "@grpc/grpc-js/build/src/constants";
import { captureException as capture_exception } from "@sentry/nextjs";

import { get_blog_sitemap } from "~/common/grpc";

export const GET = async (
  _: Request,
  { params }: { params: { slug: string } }
): Promise<Response> => {
  try {
    const { slug } = params;
    const sitemap = await get_blog_sitemap({ identifier: slug });

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
