import type { Metadata } from "next";

import { getTag } from "~/common/grpc";
import { getUser } from "~/common/utils/getUser";

export const generateMetadata = async ({
  params
}: {
  params: { tagName: string };
}): Promise<Metadata> => {
  const { tagName } = params;

  try {
    const userId = await getUser();
    const tag = await getTag({
      name: tagName,
      current_user_id: userId || undefined
    });
    const description = `Read stories tagged with #${tag.name} on Storiny.`;

    return {
      title: `#${tagName}`,
      description,
      openGraph: {
        type: "website",
        siteName: "Storiny",
        title: `#${tagName}`,
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/tag/${tagName}`,
        description
      },
      twitter: {
        card: "summary",
        title: `#${tagName}`,
        description
      }
    };
  } catch {
    return {
      title: `#${tagName}`
    };
  }
};
