import { ImageSize } from "@storiny/shared";
import type { Metadata } from "next";
import { get_user } from "~/common/utils/get-user";

import { get_profile } from "~/common/grpc";
import { get_cdn_url } from "~/utils/get-cdn-url";

export const generateMetadata = async ({
  params
}: {
  params: { username: string };
}): Promise<Metadata> => {
  const { username } = params;

  try {
    const user_id = await get_user();
    const profile = await get_profile({
      username,
      current_user_id: user_id || undefined
    });
    const description = `Read stories from ${profile.name} on Storiny.${
      profile.bio ? ` ${profile.bio}` : ""
    }`;

    /* eslint-disable prefer-snakecase/prefer-snakecase */
    return {
      title: `${profile.name} (@${username})`,
      description,
      openGraph: {
        type: "profile",
        siteName: "Storiny",
        title: `${profile.name} (@${username})`,
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/${username}`,
        description,
        images:
          profile.is_private || !profile.avatar_id
            ? []
            : [
                {
                  url: get_cdn_url(profile.avatar_id, ImageSize.W_256),
                  width: 256,
                  height: 256
                }
              ]
      },
      twitter: {
        card: "summary",
        title: `${profile.name} (@${username})`,
        description,
        images:
          profile.is_private || !profile.avatar_id
            ? []
            : [get_cdn_url(profile.avatar_id, ImageSize.W_256)]
      }
    };
    /* eslint-enable prefer-snakecase/prefer-snakecase */
  } catch {
    return {
      title: `@${username}`
    };
  }
};
