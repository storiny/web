import { ImageSize, UserFlag } from "@storiny/shared";
import React from "react";
import { Graph } from "schema-dts";

import { Flag } from "~/common/flags";
import { GetProfileResponse } from "~/common/grpc";
import LeftSidebar from "~/layout/LeftSidebar";
import SplashScreen from "~/layout/SplashScreen";
import { getCdnUrl } from "~/utils/getCdnUrl";
import { truncate } from "~/utils/truncate";

import Client from "./client";
import ProfileRightSidebar from "./right-sidebar";

interface Props {
  profile: GetProfileResponse;
}

const generateJsonLd = (profile: Props["profile"]): Graph => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      alternateName: "Share your story.",
      image: {
        "@type": "ImageObject",
        height: "128",
        url: getCdnUrl("web-assets/brand/logos/plain/logo", ImageSize.W_128),
        width: "128",
      },
      name: "Storiny",
      url: process.env.NEXT_PUBLIC_WEB_URL,
    },
    {
      "@type": "Person",
      alternateName: `@${profile.username}`,
      description: truncate(profile.bio, 150),
      identifier: profile.id,
      image: profile.avatar_id
        ? {
            "@type": "ImageObject",
            height: "64",
            url: getCdnUrl(profile.avatar_id, ImageSize.W_64),
            width: "64",
          }
        : undefined,
      jobTitle: "Writer at Storiny",
      mainEntityOfPage: {
        "@id": `${process.env.NEXT_PUBLIC_WEB_URL}/${profile.username}`,
        "@type": "WebPage",
        image: profile.avatar_id
          ? {
              "@type": "ImageObject",
              url: getCdnUrl(profile.avatar_id, ImageSize.W_256),
              width: "256",
            }
          : undefined,
        name: `${profile.name}'s profile on Storiny`,
      },
      name: profile.name,
      url: `${process.env.NEXT_PUBLIC_WEB_URL}/${profile.username}`,
    },
  ],
});

const JsonLD = ({ profile }: Props): React.ReactElement => {
  const jsonLd = generateJsonLd(profile);
  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      type="application/ld+json"
    />
  );
};

const Component = ({ profile }: Props): React.ReactElement => {
  const flags = React.useMemo(
    () => new Flag(profile.public_flags),
    [profile.public_flags]
  );
  const isSuspended = flags.hasAnyOf([
    UserFlag.PERMANENTLY_SUSPENDED,
    UserFlag.TEMPORARILY_SUSPENDED,
  ]);
  const isPrivate =
    Boolean(profile.is_private) && !profile.is_friend && !profile.is_self;

  return (
    <>
      <LeftSidebar />
      <main>
        {isPrivate || isSuspended ? null : <JsonLD profile={profile} />}
        <Client
          isPrivate={isPrivate}
          isSuspended={isSuspended}
          profile={profile}
        />
      </main>
      <ProfileRightSidebar
        isPrivate={isPrivate}
        isSuspended={isSuspended}
        profile={profile}
      />
      <SplashScreen />
    </>
  );
};

export default Component;
