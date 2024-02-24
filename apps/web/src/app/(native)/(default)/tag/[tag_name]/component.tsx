import { ImageSize } from "@storiny/shared";
import React from "react";
import { Graph } from "schema-dts";

import { GetTagResponse } from "~/common/grpc";
import LeftSidebar from "~/layout/left-sidebar";
import SplashScreen from "~/layout/splash-screen";

import Client from "./client";
import TagRightSidebar from "./right-sidebar";

interface Props {
  tag: GetTagResponse;
}

const generate_json_ld = (tag: Props["tag"]): Graph => ({
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
      "@type": "Thing",
      description: `Read stories tagged with #${tag.name} on Storiny`,
      identifier: tag.id,
      mainEntityOfPage: {
        "@id": `${process.env.NEXT_PUBLIC_WEB_URL}/tag/${tag.name}`,
        "@type": "WebPage",
        name: tag.name
      },
      name: `#${tag.name}`,
      url: `${process.env.NEXT_PUBLIC_WEB_URL}/tag/${tag.name}`
    }
  ]
  /* eslint-enable prefer-snakecase/prefer-snakecase */
});

const Component = ({ tag }: Props): React.ReactElement => {
  const json_ld = generate_json_ld(tag);
  return (
    <>
      <LeftSidebar />
      <main data-root={"true"}>
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(json_ld) }}
          type="application/ld+json"
        />
        <Client tag={tag} />
      </main>
      <TagRightSidebar tag={tag} />
      <SplashScreen />
    </>
  );
};

export default Component;
