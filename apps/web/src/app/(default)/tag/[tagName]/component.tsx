import { ImageSize } from "@storiny/shared";
import React from "react";
import { Graph } from "schema-dts";

import { GetTagResponse } from "~/common/grpc";
import LeftSidebar from "~/layout/LeftSidebar";
import SplashScreen from "~/layout/SplashScreen";
import { getCdnUrl } from "~/utils/getCdnUrl";

import Client from "./client";
import TagRightSidebar from "./right-sidebar";

interface Props {
  tag: GetTagResponse;
}

const generateJsonLd = (tag: Props["tag"]): Graph => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      alternateName: "Share your story.",
      image: {
        "@type": "ImageObject",
        height: "128",
        url: getCdnUrl("web-assets/brand/logos/plain/logo", ImageSize.W_128),
        width: "128"
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
});

const Component = ({ tag }: Props): React.ReactElement => {
  const jsonLd = generateJsonLd(tag);

  return (
    <>
      <LeftSidebar />
      <main>
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
