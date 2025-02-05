import { Status } from "@grpc/grpc-js/build/src/constants";
import { captureException as capture_exception } from "@sentry/nextjs";
import { Metadata } from "next";
import { notFound as not_found } from "next/dist/client/components/not-found";

import { get_blog } from "~/common/grpc";
import { get_user } from "~/common/utils/get-user";
import { is_valid_blog_identifier } from "~/common/utils/is-valid-blog-identifier";

export const generateMetadata = async ({
  params
}: {
  params: Promise<{ identifier: string }>;
}): Promise<Metadata> => {
  const { identifier } = await params;

  try {
    if (!is_valid_blog_identifier(identifier)) {
      return not_found();
    }

    const user_id = await get_user();
    const blog = await get_blog({
      identifier,
      current_user_id: user_id || undefined
    });

    return {
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      title: {
        template: `%s — ${blog.name}`,
        default: `Dashboard — ${blog.name}`
      }
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
