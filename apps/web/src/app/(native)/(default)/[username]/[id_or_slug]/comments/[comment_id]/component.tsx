import { ImageSize } from "@storiny/shared";
import React from "react";
import { Graph } from "schema-dts";

import { GetCommentResponse } from "~/common/grpc";
import LeftSidebar from "~/layout/left-sidebar";
import SplashScreen from "~/layout/splash-screen";
import { get_cdn_url } from "~/utils/get-cdn-url";
import { truncate } from "~/utils/truncate";

import Client from "./client";
import StoryCommentsRightSidebar from "./right-sidebar";

type Props = GetCommentResponse;

const generate_json_ld = (comment: Props): Graph => ({
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      alternateName: "Share your story.",
      image: {
        "@type": "ImageObject",
        height: 128 as unknown as string,
        url: `${process.env.NEXT_PUBLIC_CDN_URL}/w@${ImageSize.W_128}/web-assets/brand/logos/plain/logo`,
        width: 128 as unknown as string
      },
      name: "Storiny",
      url: process.env.NEXT_PUBLIC_WEB_URL
    },
    {
      "@type": "Comment",
      name: `${comment.user?.name || "User"} on Storiny: "${truncate(
        comment.content,
        128
      )}"`,
      identifier: comment.id,
      datePublished: comment.created_at,
      dateModified: comment.edited_at || undefined,
      url: `${process.env.NEXT_PUBLIC_WEB_URL}/${comment.story_writer_username}/${comment.story_slug}/comments/${comment.id}`,
      upvoteCount: comment.like_count,
      text: comment.content,
      author: {
        "@type": "Person",
        alternateName: `@${comment.user?.username}`,
        identifier: comment.user_id,
        image: comment.user?.avatar_id
          ? {
              "@type": "ImageObject",
              height: 64 as unknown as string,
              url: get_cdn_url(comment.user.avatar_id, ImageSize.W_64),
              width: 64 as unknown as string
            }
          : undefined,
        name: comment.user?.name,
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/${comment.user?.username}`
      }
    }
  ]
  /* eslint-enable prefer-snakecase/prefer-snakecase */
});

const JsonLD = (props: Props): React.ReactElement => {
  const json_ld = generate_json_ld(props);
  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json_ld) }}
      type="application/ld+json"
    />
  );
};

const Component = (props: Props): React.ReactElement => (
  <>
    <LeftSidebar />
    <main data-root={"true"}>
      <JsonLD {...props} />
      <Client {...props} />
    </main>
    <StoryCommentsRightSidebar story_id={props.story_id} />
    <SplashScreen />
  </>
);

export default Component;
