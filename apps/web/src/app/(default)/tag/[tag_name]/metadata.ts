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
  } catch {
    return {
      title: `#${tag_name}`
    };
  }
};
