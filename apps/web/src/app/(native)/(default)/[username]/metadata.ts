import { Status } from "@grpc/grpc-js/build/src/constants";
import { captureException as capture_exception } from "@sentry/nextjs";
import { ImageSize } from "@storiny/shared";
import type { Metadata } from "next";

import { get_profile } from "~/common/grpc";
import { get_user } from "~/common/utils/get-user";
import { get_cdn_url } from "~/utils/get-cdn-url";

export const generateMetadata = async ({
  params
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> => {
  try {
    const [{ username }, user_id] = await Promise.all([params, get_user()]);
    const profile = await get_profile({
      username,
      current_user_id: user_id || undefined
    });
    const description = `Read stories from ${profile.name} on Storiny.${
      profile.bio ? ` ${profile.bio}` : ""
    }`;

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
            ? undefined
            : [
                {
                  url: get_cdn_url(profile.avatar_id, ImageSize.W_320),
                  width: 320,
                  height: 320
                }
              ]
      },
      twitter: {
        card: "summary",
        title: `${profile.name} (@${username})`,
        description,
        images:
          profile.is_private || !profile.avatar_id
            ? undefined
            : [get_cdn_url(profile.avatar_id, ImageSize.W_320)]
      }
    };
  } catch (err) {
    const err_code = err?.code;

    if (err_code !== Status.NOT_FOUND && err_code !== Status.UNAUTHENTICATED) {
      capture_exception(err);
    }

    return {
      title: "Unknown user"
    };
  }
};
