import { Status } from "@grpc/grpc-js/build/src/constants";
import { captureException as capture_exception } from "@sentry/nextjs";
import type { Metadata } from "next";

import { get_tag } from "~/common/grpc";
import { get_user } from "~/common/utils/get-user";

export const generateMetadata = async ({
  params
}: {
  params: { tag_name: string };
}): Promise<Metadata> => {
  const { tag_name } = params;

  try {
    const user_id = await get_user();
    const tag = await get_tag({
      name: tag_name,
      current_user_id: user_id || undefined
    });
    const description = `Read stories tagged with #${tag.name} on Storiny.`;

    return {
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      title: `#${tag_name}`,
      description,
      openGraph: {
        type: "website",
        siteName: "Storiny",
        title: `#${tag_name}`,
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/tag/${tag_name}`,
        description
      },
      twitter: {
        card: "summary",
        title: `#${tag_name}`,
        description
      }
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    };
  } catch (err) {
    const err_code = err?.code;

    if (err_code !== Status.NOT_FOUND && err_code !== Status.UNAUTHENTICATED) {
      capture_exception(err);
    }

    return {
      title: `#${tag_name}`
    };
  }
};
