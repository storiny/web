import { Status } from "@grpc/grpc-js/build/src/constants";
import { captureException as capture_exception } from "@sentry/nextjs";
import type { Metadata } from "next";

import { get_tag } from "~/common/grpc";
import { get_user } from "~/common/utils/get-user";

export const generateMetadata = async ({
  params
}: {
  params: Promise<{ tag_name: string }>;
}): Promise<Metadata> => {
  try {
    const [{ tag_name }, user_id] = await Promise.all([params, get_user()]);
    const tag = await get_tag({
      name: tag_name,
      current_user_id: user_id || undefined
    });
    const description = `Read stories tagged with #${tag.name} on Storiny.`;

    return {
      title: `#${tag_name}`,
      description,
      openGraph: {
        type: "website",
        siteName: "Storiny",
        title: `#${tag_name}`,
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/tag/${tag_name}`,
        description,
        images: [
          {
            url: `${process.env.NEXT_PUBLIC_OG_SERVER_URL}/tags/${tag.id}`,
            width: 1200,
            height: 630
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title: `#${tag_name}`,
        description,
        images: [`${process.env.NEXT_PUBLIC_OG_SERVER_URL}/tags/${tag.id}`]
      }
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
