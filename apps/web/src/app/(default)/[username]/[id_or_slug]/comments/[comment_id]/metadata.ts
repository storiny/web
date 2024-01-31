import { ImageSize } from "@storiny/shared";
import type { Metadata } from "next";

import { get_comment } from "~/common/grpc";
import { get_user } from "~/common/utils/get-user";
import { get_cdn_url } from "~/utils/get-cdn-url";
import { truncate } from "~/utils/truncate";

export const generateMetadata = async ({
  params
}: {
  params: { comment_id: string };
}): Promise<Metadata> => {
  try {
    const { comment_id } = params;
    const user_id = await get_user();
    const comment_response = await get_comment({
      id: comment_id,
      current_user_id: user_id || undefined
    });

    return {
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      title: `${comment_response.user?.name || "User"} on Storiny: "${truncate(
        comment_response.content,
        128
      )}"`,
      description: comment_response.content,
      openGraph: {
        type: "article",
        siteName: "Storiny",
        title: `${comment_response.user?.name || "User"} on Storiny`,
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/${comment_response.story_writer_username}/${comment_response.story_slug}/comments/${comment_id}`,
        description: comment_response.content,
        images: comment_response.user?.avatar_id
          ? [
              {
                url: get_cdn_url(
                  comment_response.user.avatar_id,
                  ImageSize.W_320
                ),
                width: 320,
                height: 320
              }
            ]
          : undefined
      },
      twitter: {
        card: "summary",
        title: `${comment_response.user?.name || "User"} on Storiny`,
        description: comment_response.content,
        images: comment_response.user?.avatar_id
          ? [get_cdn_url(comment_response.user.avatar_id, ImageSize.W_320)]
          : undefined
      }
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    };
  } catch {
    return {
      title: "Unknown comment"
    };
  }
};
