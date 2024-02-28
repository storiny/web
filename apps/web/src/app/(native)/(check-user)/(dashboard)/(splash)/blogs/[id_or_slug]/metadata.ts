import { Metadata } from "next";
import { notFound as not_found } from "next/dist/client/components/not-found";

import { get_blog } from "~/common/grpc";
import { is_valid_blog_slug } from "~/common/utils";
import { get_user } from "~/common/utils/get-user";
import { is_snowflake } from "~/common/utils/is-snowflake";

export const generateMetadata = async ({
  params
}: {
  params: { id_or_slug: string };
}): Promise<Metadata> => {
  const { id_or_slug } = params;

  try {
    if (!is_valid_blog_slug(id_or_slug) && !is_snowflake(id_or_slug)) {
      return not_found();
    }

    const user_id = await get_user();
    const blog = await get_blog({
      identifier: id_or_slug,
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
  } catch {
    return { title: "Unknown blog" };
  }
};
