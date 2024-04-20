import { ImageSize, UserFlag } from "@storiny/shared";
import React from "react";
import { Graph } from "schema-dts";

import { Flag } from "~/common/flags";
import { GetProfileResponse } from "~/common/grpc";
import Main from "~/components/main";
import LeftSidebar from "~/layout/left-sidebar";
import SplashScreen from "~/layout/splash-screen";
import { get_cdn_url } from "~/utils/get-cdn-url";
import { truncate } from "~/utils/truncate";

import Client from "./client";
import ProfileRightSidebar from "./right-sidebar";

interface Props {
  profile: GetProfileResponse;
}

const generate_json_ld = (profile: Props["profile"]): Graph => ({
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
      "@type": "Person",
      alternateName: `@${profile.username}`,
      description: truncate(profile.bio, 150),
      identifier: profile.id,
      image: profile.avatar_id
        ? {
            "@type": "ImageObject",
            height: 64 as unknown as string,
            url: get_cdn_url(profile.avatar_id, ImageSize.W_64),
            width: 64 as unknown as string
          }
        : undefined,
      jobTitle: "Writer at Storiny",
      mainEntityOfPage: {
        "@id": `${process.env.NEXT_PUBLIC_WEB_URL}/${profile.username}`,
        "@type": "WebPage",
        image: profile.avatar_id
          ? {
              "@type": "ImageObject",
              url: get_cdn_url(profile.avatar_id, ImageSize.W_320),
              width: 320 as unknown as string,
              height: 320 as unknown as string
            }
          : undefined,
        name: `${profile.name}'s profile on Storiny`
      },
      name: profile.name,
      url: `${process.env.NEXT_PUBLIC_WEB_URL}/${profile.username}`
    }
  ]
  /* eslint-enable prefer-snakecase/prefer-snakecase */
});

const JsonLD = ({ profile }: Props): React.ReactElement => {
  const json_ld = generate_json_ld(profile);
  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json_ld) }}
      type="application/ld+json"
    />
  );
};

const Component = ({ profile }: Props): React.ReactElement => {
  const flags = React.useMemo(
    () => new Flag(profile.public_flags),
    [profile.public_flags]
  );
  const is_suspended = flags.has_any_of([
    UserFlag.PERMANENTLY_SUSPENDED,
    UserFlag.TEMPORARILY_SUSPENDED
  ]);
  const is_private =
    Boolean(profile.is_private) && !profile.is_friend && !profile.is_self;

  // Remove sensitive details
  if (is_private) {
    delete profile.avatar_id;
    delete profile.avatar_hex;
    delete profile.banner_id;
    delete profile.banner_hex;
    delete profile.bio;
    delete profile.rendered_bio;
    delete profile.status;

    profile.location = "";
    profile.connections = [];
  }

  return (
    <>
      <LeftSidebar />
      <Main>
        {is_private || is_suspended ? null : <JsonLD profile={profile} />}
        <Client
          is_private={is_private}
          is_suspended={is_suspended}
          profile={profile}
        />
      </Main>
      <ProfileRightSidebar
        is_private={is_private}
        is_suspended={is_suspended}
        profile={profile}
      />
      <SplashScreen />
    </>
  );
};

export default Component;
